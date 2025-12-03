import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, X, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { customerApi, PetDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AddPetModal } from "@/components/AddPetModal";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName?: string;
}

// Removed petProfiles as we're now using dynamic pet data from API

const cities = ["Hyderabad", "Vijayawada", "Guntur", "Vishakhpatnam", "Warangal", "Rajamundry"];
const stores = ["Marshal Pet zone", "Leo Pet zone"];
const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

export const BookingModal = ({ isOpen, onClose, serviceName }: BookingModalProps) => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { latitude, longitude, loading: locationLoading, error: locationError } = useGeolocation();
  const [selectedPet, setSelectedPet] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("house-visit");
  const [address, setAddress] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [userPets, setUserPets] = useState<PetDTO[]>([]);
  const [selectedPetDetails, setSelectedPetDetails] = useState<PetDTO | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);

  // Fetch user's pets when modal opens
  useEffect(() => {
    const fetchUserPets = async () => {
      if (isOpen && user) {
        try {
          const profile = await customerApi.getProfile();
          const pets = await customerApi.getPets(profile.id);
          setUserPets(pets);
        } catch (error) {
          console.error('Failed to fetch user pets:', error);
        }
      }
    };
    fetchUserPets();
  }, [isOpen, user]);

  const resetForm = () => {
    setSelectedPet(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedCity("");
    setServiceType("house-visit");
    setAddress("");
    setSelectedStore("");
    setUserPets([]);
    setSelectedPetDetails(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePetAdded = async () => {
    // Refresh pets list after adding a new pet
    if (user) {
      try {
        const profile = await customerApi.getProfile();
        const pets = await customerApi.getPets(profile.id);
        setUserPets(pets);
        setShowAddPetModal(false);
      } catch (error) {
        console.error('Failed to refresh pets:', error);
      }
    }
  };

  const handleBook = async () => {
    if (!user) {
      toast({
        title: "Please login first",
        variant: "destructive",
      });
      return;
    }

    if (userPets.length === 0) {
      toast({
        title: "Please add a pet first",
        description: "You need to register at least one pet before booking services.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPet) {
      toast({
        title: "Please select a pet",
        description: "Select which pet you want to book services for.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "No items in cart",
        variant: "destructive",
      });
      return;
    }

    // Check if location is available
    if (locationLoading) {
      toast({
        title: "Getting your location...",
        description: "Please wait while we determine your location for finding nearby providers.",
      });
      return;
    }

    if (locationError || !latitude || !longitude) {
      toast({
        title: "Location required",
        description: "We need your location to find nearby service providers. Please enable location access.",
        variant: "destructive",
      });
      return;
    }

    // Determine occupation based on service name
    const occupation = serviceName?.toLowerCase().includes('grooming') ? 'GROOMER' :
      serviceName?.toLowerCase().includes('vet') ? 'VETERINARIAN' :
        serviceName?.toLowerCase().includes('training') ? 'TRAINER' :
          serviceName?.toLowerCase().includes('sitting') ? 'PET_SITTER' : 'GENERAL';

    try {
      // Create booking for each item in cart with location data
      for (const item of cartItems) {
        await customerApi.createBooking(item.packageId, latitude, longitude);
      }
      await clearCart();

      // Dispatch event to refresh bookings in dashboard immediately
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bookingCreated'));
      }, 100); // Small delay to ensure backend processing is complete

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: "Booking failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            {serviceName ? `Book ${serviceName}` : "Book Your Service"}
          </DialogTitle>

          {/* Pet Selection Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Select Your Pet</Label>
            {userPets.length === 0 ? (
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium mb-2">No pets registered yet</p>
                <p className="text-blue-600 text-sm mb-3">You need to register a pet before booking services.</p>
                <Button
                  onClick={() => setShowAddPetModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Add Your First Pet
                </Button>
              </div>
            ) : (
              <Select
                value={selectedPet?.toString() || ""}
                onValueChange={(value) => {
                  const petId = parseInt(value);
                  setSelectedPet(petId);
                  const pet = userPets.find(p => p.id === petId);
                  setSelectedPetDetails(pet || null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a pet" />
                </SelectTrigger>
                <SelectContent>
                  {userPets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id.toString()}>
                      {pet.name} - {pet.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Pet Details */}
          {selectedPetDetails && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-800">{selectedPetDetails.name}</h4>
              <p className="text-sm text-gray-600">Breed: {selectedPetDetails.breed}</p>
              <p className="text-sm text-gray-600">Gender: {selectedPetDetails.gender}</p>
              <p className="text-sm text-gray-600">Weight: {selectedPetDetails.weight} kg</p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Cart Items */}
          {cartItems.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Selected Services</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.packageId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-green-600 font-semibold text-xs">{item.price}</p>
                    </div>
                    <Button
                      onClick={() => removeFromCart(item.packageId)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Service Location</Label>
            <RadioGroup
              value={serviceType}
              onValueChange={setServiceType}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="house-visit" id="house-visit" />
                <Label htmlFor="house-visit" className="text-sm">House visit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="groomer-store" id="groomer-store" />
                <Label htmlFor="groomer-store" className="text-sm">Groomer store</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Address or Store Selection */}
          {serviceType === "house-visit" ? (
            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="store" className="text-sm font-medium text-gray-700">Select Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-blue-800">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Location Status</span>
            </div>
            <div className="mt-2">
              {locationLoading ? (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-xs">Getting your location...</span>
                </div>
              ) : locationError ? (
                <span className="text-xs text-red-600">{locationError}</span>
              ) : latitude && longitude ? (
                <span className="text-xs text-green-600">Location detected - Ready to find nearby providers</span>
              ) : (
                <span className="text-xs text-gray-600">Location not available</span>
              )}
            </div>
          </div>

          {/* Book Button */}
          <Button
            onClick={handleBook}
            disabled={locationLoading || !latitude || !longitude}
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locationLoading ? "Getting Location..." : "Book Service"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Success Dialog */}
    <Dialog open={showSuccessDialog} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="w-8 h-8" />
            Booking Successful!
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <p className="text-gray-600 mb-4">
            Your booking request has been sent to nearby service providers.
          </p>
          <p className="text-gray-600">
            You will be notified once a provider accepts your request.
          </p>
          <Button
            onClick={() => {
              setShowSuccessDialog(false);
              handleClose();
            }}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
