import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Calendar, User, PawPrint, MapPin, Clock, HelpCircle, FileText, Shield, LogOut, Plus, Trash2, Edit, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { ServiceCard } from "@/components/ServiceCard";
import { AddPetModal } from "@/components/AddPetModal";
import { PetSelectionModal } from "@/components/PetSelectionModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { customerApi, PetDTO, providerApi, BookingDTO, CustomerProfile, PackageRequestDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Import service images
import groomingImage from "@/assets/grooming-pet.png";
import vetImage from "@/assets/vet-pet.png";
import trainingImage from "@/assets/training-pet.png";
import sittingImage from "@/assets/sitting-pet.png";
import adoptionImage from "@/assets/adoption-pet.png";
import trackingImage from "@/assets/tracking-pet.png";
import matingImage from "@/assets/mating-pet.png";
import cabImage from "@/assets/cab-pet.png";



export const UserDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("home");
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [isPetSelectionModalOpen, setIsPetSelectionModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<{ title: string; path: string } | null>(null);
  const [pets, setPets] = useState<PetDTO[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetDTO | null>(null);
  const [petToEdit, setPetToEdit] = useState<PetDTO | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPetProfileDialogOpen, setIsPetProfileDialogOpen] = useState(false);
  const [address, setAddress] = useState<{ address: string } | null>(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isServiceHistoryDialogOpen, setIsServiceHistoryDialogOpen] = useState(false);
  const [isHelpSupportDialogOpen, setIsHelpSupportDialogOpen] = useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // New states for bookings and packages
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [bookingStatus, setBookingStatus] = useState<{ [key: number]: string }>({});
  const [packages, setPackages] = useState<Record<number, PackageRequestDTO>>({});
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Load bookings and packages on mount
  useEffect(() => {
    const fetchBookingsAndPackages = async () => {
      setIsLoadingBookings(true);
      setBookingError(null);
      try {
        const bookingsData = await customerApi.getBookingsByCustomerEmail(user?.email || "");
        setBookings(bookingsData);

        const packagesData = await providerApi.getAllPackages();
        // Map packages by id for quick lookup
        const packageMap: Record<number, PackageRequestDTO> = {};
        packagesData.forEach(pkg => {
          packageMap[pkg.id] = pkg;
        });
        setPackages(packageMap);
      } catch (error) {
        console.error("Failed to fetch bookings or packages:", error);
        setBookingError("Failed to load bookings. Please try again later.");
      } finally {
        setIsLoadingBookings(false);
      }
    };

    if (user?.email) {
      fetchBookingsAndPackages();
    }
  }, [user?.email]);

  // Listen for booking creation events to refresh bookings
  useEffect(() => {
    const handleBookingCreated = () => {
      // Refresh bookings when a new booking is created
      if (user?.email) {
        const fetchUpdatedBookings = async () => {
          try {
            const bookingsData = await customerApi.getBookingsByCustomerEmail(user.email);
            setBookings(bookingsData);
          } catch (error) {
            console.error("Failed to refresh bookings:", error);
          }
        };
        fetchUpdatedBookings();
      }
    };

    window.addEventListener('bookingCreated', handleBookingCreated);

    return () => {
      window.removeEventListener('bookingCreated', handleBookingCreated);
    };
  }, [user?.email]);

  // Load pets from API on component mount
  useEffect(() => {
    const fetchPets = async () => {
      if (!user) return; // Don't fetch if user is not authenticated

      try {
        const profile = await customerApi.getProfile();
        setCustomerId(profile.id);
        const petsFromApi = await customerApi.getPets(profile.id);
        setPets(petsFromApi);
        if (petsFromApi.length > 0 && !selectedPet) {
          setSelectedPet(petsFromApi[0]);
        }
      } catch (error) {
        console.error("Failed to fetch pets:", error);
      }
    };
    fetchPets();
  }, [user]);

  const handleServiceClick = (servicePath: string, serviceTitle: string) => {
    // Allow browsing services without authentication
    // Only require login when adding to cart or booking
    navigate(servicePath);
  };

  const handlePetSelect = async (pet: PetDTO) => {
    if (selectedService) {
      try {
        // Find package by service type from dynamically fetched packages
        const serviceType = selectedService.title.toUpperCase().replace(/\s+/g, '-').replace('VET-ON-CALL', 'VET');
        const packageEntry = Object.entries(packages).find(([_, pkg]) =>
          pkg.type?.toUpperCase() === serviceType || pkg.name?.toUpperCase().includes(selectedService.title.toUpperCase())
        );

        if (packageEntry) {
          const packageId = parseInt(packageEntry[0]);
          await addToCart(packageId);
        } else {
          console.warn(`No package found for service: ${selectedService.title}`);
          // Fallback: try to find any package with matching name
          const fallbackPackage = Object.entries(packages).find(([_, pkg]) =>
            pkg.name?.toLowerCase().includes(selectedService.title.toLowerCase().split(' ')[0])
          );
          if (fallbackPackage) {
            const packageId = parseInt(fallbackPackage[0]);
            await addToCart(packageId);
          }
        }

        // Navigate to service page with selected pet id
        navigate(selectedService.path, { state: { petId: pet.id } });
        setSelectedService(null);
        setIsPetSelectionModalOpen(false);
      } catch (error) {
        console.error("Failed to add service to cart or navigate:", error);
      }
    }
  };

  const handlePetAdded = async () => {
    try {
      if (customerId) {
        const petsFromApi = await customerApi.getPets(customerId);
        setPets(petsFromApi);
      }
    } catch (error) {
      console.error("Failed to fetch pets after adding:", error);
    }
    setIsAddPetModalOpen(false);
    setPetToEdit(null);
  };

  const handleEditPet = (pet: PetDTO) => {
    setPetToEdit(pet);
    setIsAddPetModalOpen(true);
  };

  const handleDeletePet = async (petId: number) => {
    try {
      await customerApi.deletePet(petId);
      // Refresh pets list after deletion
      if (customerId) {
        const petsFromApi = await customerApi.getPets(customerId);
        setPets(petsFromApi);
      }
    } catch (error) {
      console.error("Failed to delete pet:", error);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate("/");
  };

  const handleProfileClick = async () => {
    try {
      const profileData = await customerApi.getProfile();
      console.log("Profile data:", profileData);
      setProfile(profileData);
      setIsProfileDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleAddressClick = async () => {
    try {
      const addressData = await customerApi.getAddress();
      console.log("Address data:", addressData);
      setAddress(addressData);
      setIsAddressDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch address:", error);
    }
  };

  const handleServiceHistoryClick = () => {
    setIsServiceHistoryDialogOpen(true);
  };

  const handleHelpSupportClick = () => {
    setIsHelpSupportDialogOpen(true);
  };

  const handleTermsClick = () => {
    setIsTermsDialogOpen(true);
  };

  const handlePrivacyClick = () => {
    setIsPrivacyDialogOpen(true);
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await customerApi.cancelBooking(bookingId);
      // Refresh bookings list after cancellation
      const bookingsData = await customerApi.getBookingsByCustomerEmail(user?.email || "");
      setBookings(bookingsData);
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast({
        title: "Cancellation failed",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const services = [
    { title: "GROOMING", bgColor: "bg-gradient-to-br from-purple-400 to-pink-400", image: groomingImage, path: "/grooming" },
    { title: "VET ON CALL", bgColor: "bg-gradient-to-br from-blue-400 to-cyan-400", image: vetImage, path: "/vet-on-call" },
    { title: "TRAINING", bgColor: "bg-gradient-to-br from-green-400 to-emerald-400", image: trainingImage, path: "/training" },
    { title: "PET SITTING", bgColor: "bg-gradient-to-br from-orange-400 to-red-400", image: sittingImage, path: "/pet-sitting" },
    { title: "ADOPTION", bgColor: "bg-gradient-to-br from-indigo-400 to-purple-400", image: adoptionImage, path: "#" },
    { title: "TRACKING", bgColor: "bg-gradient-to-br from-teal-400 to-blue-400", image: trackingImage, path: "#" },
    { title: "MATING", bgColor: "bg-gradient-to-br from-pink-400 to-rose-400", image: matingImage, path: "#" },
    { title: "CAB", bgColor: "bg-gradient-to-br from-yellow-400 to-orange-400", image: cabImage, path: "#" },
  ];

  const accountOptions = [
    { icon: User, label: "My Profile", path: "#" },
    { icon: PawPrint, label: "My Pet Profile", path: "#" },
    { icon: MapPin, label: "My Address", path: "#" },
    { icon: Clock, label: "Service History", path: "#" },
    { icon: HelpCircle, label: "Help & Support", path: "#" },
    { icon: FileText, label: "Terms & Condition", path: "#" },
    { icon: Shield, label: "Privacy Policy", path: "#" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="max-w-4xl md:max-w-6xl lg:max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate("/")} className="cursor-pointer">
              <img
                src="/lovable-uploads/1e65733e-72da-4657-999d-da4b9d32af9c.png"
                alt="FurryHub Logo"
                className="w-8 h-8 object-contain"
              />
            </button>
            <h1 className="text-2xl font-black text-gray-800">
              FURRY HUB
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Welcome back, {user?.firstName || 'User'}!
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full bg-red-500 hover:bg-red-600 text-white hover:text-white w-10 h-10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl md:max-w-6xl lg:max-w-7xl mx-auto px-4 py-6 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="home" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Our Services</h2>
                  <p className="text-gray-600">Choose from our comprehensive pet care services</p>
                </div>
                <Button
                  onClick={() => setIsAddPetModalOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <PawPrint className="w-4 h-4" />
                  Add Pet
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {services.map((service, index) => (
                  <div key={index} className="border rounded-lg p-4 flex flex-col">
                    <ServiceCard
                      title={service.title}
                      bgColor={service.bgColor}
                      image={service.image}
                      onClick={() => handleServiceClick(service.path, service.title)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="booking" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">My Bookings</h3>

              {isLoadingBookings ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading bookings...</div>
                </div>
              ) : bookingError ? (
                <div className="text-center py-8">
                  <div className="text-red-500">{bookingError}</div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Booking Request</h3>
                  <p className="text-gray-600">You haven't made any bookings yet. Start by exploring our services!</p>
                  <Button
                    onClick={() => setActiveTab("home")}
                    className="mt-4"
                  >
                    Browse Services
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const packageDetails = packages[booking.packageId];
                    return (
                      <Card key={booking.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {packageDetails ? packageDetails.name : `Package ${booking.packageId}`}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {packageDetails ? packageDetails.description : 'Service details not available'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">₹{booking.totalPrice}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:gap-6 text-sm mb-3">
                          <div>
                            <span className="font-medium">Status:</span>
                            {booking.status === 'PENDING' ? (
                              <span className="text-orange-600 font-semibold ml-1">Pending request waiting</span>
                            ) : booking.status === 'CONFIRMED' ? (
                              <span className="text-green-600 font-semibold ml-1">Provider is visiting</span>
                            ) : (
                              <span className={`ml-1 ${booking.status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'}`}>
                                {booking.status}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {packageDetails ? packageDetails.duration : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Booked on:</span> {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {booking.status === 'PENDING' && (
                          <div className="flex justify-end mt-3">
                            <Button
                              onClick={() => handleCancelBooking(booking.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                        {booking.status === 'CONFIRMED' && booking.providerPhoneNumber && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                            <div className="flex items-center space-x-2 text-green-800">
                              <User className="w-4 h-4" />
                              <span className="font-medium">Provider Details:</span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-green-600" />
                                <span className="text-sm">{booking.providerPhoneNumber}</span>
                              </div>
                              {booking.providerName && (
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">{booking.providerName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h3>

              {accountOptions.map((option, index) => {
                if (option.label === "My Profile") {
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleProfileClick}>
                      <div className="flex items-center space-x-3">
                        <option.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800 font-medium">{option.label}</span>
                      </div>
                    </Card>
                  );
                }
                if (option.label === "My Pet Profile") {
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsPetProfileDialogOpen(true)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <option.icon className="w-5 h-5 text-gray-600" />
                          <span className="text-gray-800 font-medium">{option.label}</span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddPetModalOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Pet
                        </Button>
                      </div>
                    </Card>
                  );
                }
                if (option.label === "My Address") {
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleAddressClick}>
                      <div className="flex items-center space-x-3">
                        <option.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800 font-medium">{option.label}</span>
                      </div>
                    </Card>
                  );
                }
                if (option.label === "Service History") {
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleServiceHistoryClick}>
                      <div className="flex items-center space-x-3">
                        <option.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800 font-medium">{option.label}</span>
                      </div>
                    </Card>
                  );
                }
                if (option.label === "Help & Support") {
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleHelpSupportClick}>
                      <div className="flex items-center space-x-3">
                        <option.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800 font-medium">{option.label}</span>
                      </div>
                    </Card>
                  );
                }
                if (option.label === "Terms & Condition") {
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleTermsClick}>
                      <div className="flex items-center space-x-3">
                        <option.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800 font-medium">{option.label}</span>
                      </div>
                    </Card>
                  );
                }
                if (option.label === "Privacy Policy") {
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handlePrivacyClick}>
                      <div className="flex items-center space-x-3">
                        <option.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-800 font-medium">{option.label}</span>
                      </div>
                    </Card>
                  );
                }
                return (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <option.icon className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-800 font-medium">{option.label}</span>
                    </div>
                  </Card>
                );
              })}

              <Card
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border-red-200 hover:border-red-300"
                onClick={handleLogout}
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium">Logout</span>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-4xl md:max-w-6xl lg:max-w-7xl mx-auto">
          <div className="flex justify-around">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                activeTab === "home"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Home className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">HOME</span>
            </button>

            <button
              onClick={() => setActiveTab("booking")}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                activeTab === "booking"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Calendar className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">BOOKING</span>
            </button>

            <button
              onClick={() => setActiveTab("account")}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                activeTab === "account"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">ACCOUNT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Pet Modal */}
      <AddPetModal
        isOpen={isAddPetModalOpen}
        onClose={() => setIsAddPetModalOpen(false)}
        onPetAdded={handlePetAdded}
        petToEdit={petToEdit}
      />

      {/* Pet Selection Modal */}
      <PetSelectionModal
        isOpen={isPetSelectionModalOpen}
        onClose={() => setIsPetSelectionModalOpen(false)}
        pets={pets}
        onPetSelected={handlePetSelect}
        serviceName={selectedService?.title || ""}
        onAddNewPet={() => setIsAddPetModalOpen(true)}
      />

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Profile Details</DialogTitle>
            <DialogDescription>View and manage your profile information.</DialogDescription>
          </DialogHeader>
          {profile && (
            <div className="space-y-3">
              <div><span className="font-medium">Email:</span> {profile.email}</div>
              <div><span className="font-medium">First Name:</span> {profile.firstName}</div>
              <div><span className="font-medium">Last Name:</span> {profile.lastName}</div>
              <div><span className="font-medium">Phone Number:</span> {profile.phoneNumber}</div>
              <div><span className="font-medium">Address:</span> {profile.address}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pet Profile Dialog */}
      <Dialog open={isPetProfileDialogOpen} onOpenChange={setIsPetProfileDialogOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-6xl lg:max-w-7xl">
          <DialogHeader>
            <DialogTitle>My Pet Profile</DialogTitle>
            <DialogDescription>View and manage your pet information.</DialogDescription>
          </DialogHeader>
          {pets.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {pets.map((pet) => (
                  <Card key={pet.id} className="p-3 bg-gray-50">
                    <div className="flex flex-col h-full">
                      <div className="text-sm flex-1">
                        <div><span className="font-medium">Name:</span> {pet.name}</div>
                        <div><span className="font-medium">Breed:</span> {pet.breed}</div>
                        <div><span className="font-medium">Gender:</span> {pet.gender}</div>
                        <div><span className="font-medium">Weight:</span> {pet.weight} kg</div>
                        <div><span className="font-medium">Color:</span> {pet.color || 'Not specified'}</div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleEditPet(pet)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeletePet(pet.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <PawPrint className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No pets added yet</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Address</DialogTitle>
            <DialogDescription>View and manage your address information.</DialogDescription>
          </DialogHeader>
          {address && (
            <div className="space-y-3">
              <div><span className="font-medium">Address:</span> {address.address}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-800">
              Confirm Logout
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout from your account?
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmLogout}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service History Dialog */}
      <Dialog open={isServiceHistoryDialogOpen} onOpenChange={setIsServiceHistoryDialogOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-6xl lg:max-w-7xl">
          <DialogHeader>
            <DialogTitle>Service History</DialogTitle>
            <DialogDescription>View your past service bookings and history.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bookings.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bookings.map((booking) => {
                  const packageDetails = packages[booking.packageId];
                  return (
                    <Card key={booking.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {packageDetails ? packageDetails.name : `Package ${booking.packageId}`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {packageDetails ? packageDetails.description : 'Service details not available'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">₹{booking.totalPrice}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                        <div className="grid grid-cols-2 gap-4 md:gap-6 text-sm mb-3">
                          <div>
                            <span className="font-medium">Status:</span>
                            <span className={`ml-1 ${booking.status === 'PENDING' ? 'text-orange-600' : booking.status === 'CONFIRMED' ? 'text-green-600' : booking.status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'}`}>
                              {booking.status}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {packageDetails ? packageDetails.duration : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Booked on:</span> {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Completed on:</span> {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'Not completed'}
                          </div>
                        </div>
                        {booking.status === 'PENDING' && (
                          <div className="flex justify-end mt-3">
                            <Button
                              onClick={() => handleCancelBooking(booking.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No service history available.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog */}
      <Dialog open={isHelpSupportDialogOpen} onOpenChange={setIsHelpSupportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>Get help and support for your FurryHub account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Contact Us</h4>
              <p className="text-sm text-gray-600 mb-2">Email: furryhubindia@gmail.com</p>
              <p className="text-sm text-gray-600">Phone: +91-XXXXXXXXXX</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Common Questions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• How to book a service?</li>
                <li>• How to add/edit pet information?</li>
                <li>• How to track booking status?</li>
                <li>• How to contact service provider?</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">WhatsApp Support</h4>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                💬 Message us on WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms & Conditions Dialog */}
      <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms & Conditions</DialogTitle>
            <DialogDescription>Please read our terms and conditions carefully.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h4>
              <p>By accessing and using FurryHub, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">2. Use License</h4>
              <p>Permission is granted to temporarily use FurryHub for personal, non-commercial transitory viewing only.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">3. Service Description</h4>
              <p>FurryHub provides pet care services including grooming, veterinary care, training, and pet sitting through verified service providers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">4. User Responsibilities</h4>
              <p>Users must provide accurate information about themselves and their pets. Users are responsible for their account security.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">5. Payment Terms</h4>
              <p>All payments are processed securely. Services are confirmed only after payment verification.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">6. Cancellation Policy</h4>
              <p>Cancellations must be made at least 24 hours before the scheduled service time for a full refund.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={isPrivacyDialogOpen} onOpenChange={setIsPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>How we collect, use, and protect your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">1. Information We Collect</h4>
              <p>We collect information you provide directly to us, such as when you create an account, book services, or contact us for support.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">2. How We Use Your Information</h4>
              <p>We use the information to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">3. Information Sharing</h4>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">4. Data Security</h4>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">5. Your Rights</h4>
              <p>You have the right to access, update, or delete your personal information. Contact us to exercise these rights.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">6. Contact Us</h4>
              <p>If you have any questions about this Privacy Policy, please contact us at furryhubindia@gmail.com.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
