import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { User, Calendar, Clock, MapPin, Phone, Mail, Star, CheckCircle, XCircle, Map, Route, Layers, AlertTriangle, Navigation } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { providerApi, Provider, BookingDTO, CompleteRequestDTO } from "@/lib/api";
import { EditProfileModal } from "@/components/EditProfileModal";
import { OrderMap } from "@/components/OrderMap";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance } from "@/utils/distance";

interface ProviderProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  fieldType: string;
  specialization: string;
  experience: number;
  licenseNumber: string;
  houseVisit: boolean;
  petStoreName?: string;
}

export const FurrySquadDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { latitude: providerLat, longitude: providerLng, loading: locationLoading } = useGeolocation();

  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [partialData, setPartialData] = useState<{ bookings?: BookingDTO[], profile?: ProviderProfile }>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [completingBookingId, setCompletingBookingId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [acceptingBookings, setAcceptingBookings] = useState<Set<number>>(new Set());

  // Map feature states
  const [showClustering, setShowClustering] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [geofenceAlerts, setGeofenceAlerts] = useState<{ bookingId: number, distance: number }[]>([]);
  const [sortByDistance, setSortByDistance] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'PROVIDER') {
      navigate('/dashboard'); // or show error
      return;
    }

    // Auto-refresh bookings every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === "bookings") {
        fetchBookings();
      }
    }, 30000);

    const fetchData = async (isRetry = false) => {
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      } else {
        setRetryCount(0);
      }

      try {
        setLoading(true);
        setError(null);

        // Use Promise.allSettled to handle partial failures gracefully
        const results = await Promise.allSettled([
          // Always try to fetch bookings - API will handle location fallback
          providerApi.getProviderBookings(providerLat, providerLng),
          providerApi.getProviderProfile()
        ]);

        const newPartialData: { bookings?: BookingDTO[], profile?: ProviderProfile } = {};

        // Handle bookings result
        if (results[0].status === 'fulfilled') {
          setBookings(results[0].value);
          newPartialData.bookings = results[0].value;
        } else {
          console.error('Failed to fetch bookings:', results[0].reason);
          // Keep existing bookings if available
          if (partialData.bookings) {
            newPartialData.bookings = partialData.bookings;
          }
        }

        // Handle profile result
        if (results[1].status === 'fulfilled') {
          setProfile(results[1].value);
          newPartialData.profile = results[1].value;
        } else {
          console.error('Failed to fetch profile:', results[1].reason);
          // Keep existing profile if available
          if (partialData.profile) {
            newPartialData.profile = partialData.profile;
          }
        }

        setPartialData(newPartialData);

        // Set error only if both requests failed
        if (results[0].status === 'rejected' && results[1].status === 'rejected') {
          setError('Failed to load both bookings and profile data. Please try again.');
        } else if (results[0].status === 'rejected') {
          setError('Failed to load bookings data, but profile loaded successfully.');
        } else if (results[1].status === 'rejected') {
          setError('Failed to load profile data, but bookings loaded successfully.');
        } else {
          setError(null);
        }

      } catch (err) {
        setError('Unexpected error occurred while loading data');
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => clearInterval(interval);
  }, [user, navigate, activeTab]);

  // Calculate distances and filter/sort bookings
  const processedBookings = useMemo(() => {
    if (!providerLat || !providerLng) return bookings;

    const bookingsWithDistance = bookings.map(booking => {
      let distance = null;
      if (booking.latitude && booking.longitude) {
        distance = calculateDistance(providerLat, providerLng, booking.latitude, booking.longitude);
      }
      return { ...booking, distance };
    });

    // Filter out bookings more than 50km away (only show nearby ones)
    const nearbyBookings = bookingsWithDistance.filter(booking =>
      booking.distance === null || booking.distance <= 50
    );

    // Sort by distance if enabled
    if (sortByDistance) {
      nearbyBookings.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return nearbyBookings;
  }, [bookings, providerLat, providerLng, sortByDistance]);

  const handleBookingAction = async (bookingId: number, action: "accept" | "cancel") => {
    if (!user?.email) return;

    // Check if provider is within 10km range for accepting bookings
    if (action === "accept") {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && booking.latitude && booking.longitude && providerLat && providerLng) {
        const distance = calculateDistance(providerLat, providerLng, booking.latitude, booking.longitude);
        if (distance > 10) { // 10km limit
          toast({
            title: "Cannot Accept Booking",
            description: `This booking is ${distance.toFixed(1)}km away. You can only accept bookings within 10km of your location.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Set loading state for the specific booking
    setAcceptingBookings(prev => new Set(prev).add(bookingId));

    try {
      if (action === "accept") {
        await providerApi.confirmBooking(bookingId);
        // Immediately refresh bookings to get latest status
        await fetchBookings();
        toast({
          title: "Booking Accepted",
          description: "You have successfully accepted this booking. An OTP has been sent to the customer.",
          variant: "default",
        });
      } else {
        try {
          await providerApi.cancelBooking(bookingId);
          setBookings(prev =>
            prev.map(booking =>
              booking.id === bookingId
                ? { ...booking, status: "CANCELLED" }
                : booking
            )
          );
          toast({
            title: "Booking Rejected",
            description: "You have rejected this booking request.",
            variant: "default",
          });
        } catch (cancelError) {
          console.error('Failed to reject booking:', cancelError);
          // If cancel fails, just remove from local state to hide the booking
          setBookings(prev => prev.filter(booking => booking.id !== bookingId));
          toast({
            title: "Booking Hidden",
            description: "This booking request has been hidden from your view.",
            variant: "default",
          });
        }
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
      const status = err.response?.status;
      const errorData = err.response?.data;

      let errorMessage = 'Failed to update booking. Please try again.';
      let title = "Error";

      if (status === 409) { // Conflict - booking already accepted
        errorMessage = errorData?.error || "This booking was already accepted by another provider.";
        title = "Booking Unavailable";
        // Auto-refresh to show updated status
        await fetchBookings();
      } else if (status === 400) { // Bad Request - various validation errors
        errorMessage = errorData?.error || "Invalid booking request.";
        title = "Cannot Accept Booking";
      } else if (status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }

      toast({
        title,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Remove loading state
      setAcceptingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  // Separate function to fetch bookings for auto-refresh
  const fetchBookings = async () => {
    try {
      // Always try to fetch with current location, but if not available, API will use provider's stored location
      const updatedBookings = providerLat && providerLng
        ? await providerApi.getProviderBookings(providerLat, providerLng)
        : await providerApi.getProviderBookings();
      setBookings(updatedBookings);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Failed to refresh bookings:', err);
      // Don't show error toast for background refresh, just log it
    }
  };

  const handleCompleteBooking = async () => {
    if (!completingBookingId) return;

    try {
      await providerApi.completeBooking(completingBookingId, { otp });
      setBookings(prev =>
        prev.map(booking =>
          booking.id === completingBookingId
            ? { ...booking, status: "COMPLETED" }
            : booking
        )
      );
      setCompletingBookingId(null);
      setOtp('');
    } catch (err) {
      console.error('Failed to complete booking:', err);
      const errorMessage = err?.response?.status === 500
        ? 'Server error occurred while completing booking. Please try again later.'
        : 'Failed to complete booking. Please check the OTP and try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGeofenceAlert = (bookingId: number, distance: number) => {
    const existingAlert = geofenceAlerts.find(alert => alert.bookingId === bookingId);
    if (!existingAlert) {
      setGeofenceAlerts(prev => [...prev, { bookingId, distance }]);
      toast({
        title: "Geofence Alert",
        description: `Order #${bookingId} is within ${distance}m of your location!`,
        variant: "default",
      });
    }
  };

  const renderHomeSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Provider Profile</h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
          Edit Profile
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading profile...</div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{error}</div>
          {retryCount < 3 && (
            <Button
              onClick={() => fetchData(true)}
              variant="outline"
              size="sm"
            >
              Retry ({retryCount}/3)
            </Button>
          )}
        </div>
      ) : profile ? (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {user?.firstName} {user?.lastName}
                </CardTitle>
                <p className="text-gray-600">{profile.fieldType}</p>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">4.8 rating</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{profile.email || user?.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{profile.phoneNumber ?? ''}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{profile.address ?? ''}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Experience: </span>
                  <span className="text-sm text-gray-600">{profile.experience} years</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Specialization: </span>
                  <span className="text-sm text-gray-600">{profile.specialization}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">License: </span>
                  <span className="text-sm text-gray-600">{profile.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">House Visits: </span>
                  <Badge variant={profile.houseVisit ? "default" : "secondary"}>
                    {profile.houseVisit ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>

            {profile.petStoreName && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-2">Clinic Information</h4>
                <p className="text-sm text-gray-600">{profile.petStoreName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">No profile data available</div>
      )}
    </div>
  );

  const renderBookingsSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Booking Requests</h2>
        <Button
          variant={sortByDistance ? "default" : "outline"}
          size="sm"
          onClick={() => setSortByDistance(!sortByDistance)}
        >
          <Navigation className="w-4 h-4 mr-2" />
          {sortByDistance ? "Sorted by Distance" : "Sort by Distance"}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading bookings...</div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{error}</div>
          {retryCount < 3 && (
            <Button
              onClick={() => fetchData(true)}
              variant="outline"
              size="sm"
            >
              Retry ({retryCount}/3)
            </Button>
          )}
        </div>
      ) : processedBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No booking requests at the moment</p>
            <p className="text-sm text-gray-500 mt-2">Check back later for new requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {processedBookings.map((booking) => {
            const isAssigned = booking.status === "CONFIRMED";
            const getRequestTypeColor = (type?: string) => {
              switch (type) {
                case "CONFIRMED": return "border-l-green-500";
                case "SPECIFIC": return "border-l-blue-500";
                case "DISCOVERY": return "border-l-purple-500";
                default: return "border-l-gray-500";
              }
            };

            const getRequestTypeBadge = (type?: string) => {
              switch (type) {
                case "CONFIRMED": return { text: "Confirmed", variant: "default" as const };
                case "SPECIFIC": return { text: "Direct Request", variant: "secondary" as const };
                case "DISCOVERY": return { text: "Nearby", variant: "outline" as const };
                default: return { text: booking.status, variant: "secondary" as const };
              }
            };

            const badgeInfo = getRequestTypeBadge(booking.requestType);

            return (
              <Card key={booking.id} className={`border-l-4 ${getRequestTypeColor(booking.requestType)}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Customer ID: {booking.customerId}
                      </h3>
                      <p className="text-gray-600">
                        Service: {booking.packageId}
                      </p>
                      {booking.distance !== null && (
                        <div className="flex items-center space-x-2 mt-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-blue-600 font-medium">
                            {booking.distance.toFixed(1)} km away
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={badgeInfo.variant}>
                        {badgeInfo.text}
                      </Badge>
                      {booking.requestType === "DISCOVERY" && (
                        <Badge variant="outline" className="text-xs">
                          Discovery
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{booking.bookingDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Customer: {booking.customerId}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Total: </span>
                        <span className="text-sm text-gray-600">₹{booking.totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {booking.status === "PENDING" && !isAssigned && (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        onClick={() => handleBookingAction(booking.id, "accept")}
                        className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                        size="sm"
                        disabled={acceptingBookings.has(booking.id) || (booking.distance !== null && booking.distance > 10)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {acceptingBookings.has(booking.id)
                          ? "Accepting..."
                          : booking.distance !== null && booking.distance > 10
                            ? "Too Far"
                            : "Accept"}
                      </Button>
                      {booking.requestType === "SPECIFIC" && (
                        <Button
                          onClick={() => handleBookingAction(booking.id, "cancel")}
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      )}
                    </div>
                  )}

                  {booking.status === "CONFIRMED" && (
                    <div className="flex flex-col space-y-3 mt-4">
                      <Button
                        onClick={() => {
                          setCompletingBookingId(booking.id);
                          setOtp('');
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Complete Booking
                      </Button>
                      {completingBookingId === booking.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter OTP"
                            className="border p-2 mr-2 w-full"
                          />
                          <div className="flex space-x-2 mt-2">
                            <Button onClick={handleCompleteBooking} size="sm">Submit</Button>
                            <Button onClick={() => setCompletingBookingId(null)} variant="outline" size="sm">Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isAssigned && booking.providerId !== profile?.id && (
                    <div className="text-red-600 font-semibold mt-2">
                      Request already assigned to another provider
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMapSection = () => {
    const providerLocation = providerLat && providerLng ? { lat: providerLat, lng: providerLng } : undefined;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Order Locations</h2>
          <div className="flex space-x-2">
            <Button
              variant={showClustering ? "default" : "outline"}
              size="sm"
              onClick={() => setShowClustering(!showClustering)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Cluster
            </Button>
            <Button
              variant={showRouting ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRouting(!showRouting)}
            >
              <Route className="w-4 h-4 mr-2" />
              Route
            </Button>
            <Button
              variant={showHeatmap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              <Map className="w-4 h-4 mr-2" />
              Heatmap
            </Button>
          </div>
        </div>

        {locationLoading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Getting your location...</span>
            </div>
          </div>
        )}

        {geofenceAlerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-800">Geofence Alerts</h3>
                  <div className="space-y-1 mt-2">
                    {geofenceAlerts.map((alert, index) => (
                      <p key={index} className="text-sm text-orange-700">
                        Order #{alert.bookingId} is {alert.distance}m away!
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <OrderMap
          bookings={bookings}
          providerLocation={providerLocation}
          showClustering={showClustering}
          showRouting={showRouting}
          showHeatmap={showHeatmap}
          onGeofenceAlert={handleGeofenceAlert}
        />

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Clustering:</strong> Groups nearby orders when zoomed out</li>
            <li><strong>Routing:</strong> Shows optimal route between your location and orders</li>
            <li><strong>Heatmap:</strong> Visualizes service demand areas (darker = higher demand)</li>
            <li><strong>Geofencing:</strong> Alerts when orders are within 500m of your location</li>
            <li><strong>Real-time Tracking:</strong> Shows your current location on the map</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center min-h-16 py-2 sm:py-0">
            <div className="mb-2 sm:mb-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Furry Squad Dashboard</h1>
              <div className="text-sm text-gray-600">
                Welcome back, {user?.firstName || 'User'}!
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("home")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === "home"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ml-4 sm:ml-8 ${activeTab === "bookings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ml-4 sm:ml-8 ${activeTab === "map"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Map className="w-4 h-4 inline mr-2" />
              Order Map
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "home" && renderHomeSection()}
        {activeTab === "bookings" && renderBookingsSection()}
        {activeTab === "map" && renderMapSection()}
      </div>

      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onProfileUpdate={(updatedProfile) => setProfile(updatedProfile as ProviderProfile)}
        />
      )}
    </div>
  );
};

export default FurrySquadDashboard;
