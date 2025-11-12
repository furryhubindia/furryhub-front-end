import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGeolocationOnRequest } from "@/hooks/useGeolocationOnRequest";
import { geocodePostalCode, validatePostalCode } from "@/utils/geocoding";

const UserRegister = () => {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();
  const { toast } = useToast();
  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useGeolocationOnRequest();

  // User signup form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locationRequested, setLocationRequested] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'postal' | 'gps'>('postal');

  const handleGetLocationFromPostalCode = async () => {
    if (!postalCode.trim()) {
      toast({
        title: "Postal code required",
        description: "Please enter a postal code",
        variant: "destructive",
      });
      return;
    }

    if (!validatePostalCode(postalCode)) {
      toast({
        title: "Invalid postal code",
        description: "Please enter a valid 6-digit postal code",
        variant: "destructive",
      });
      return;
    }

    setGeocodingLoading(true);
    try {
      const result = await geocodePostalCode(postalCode);
      setLocationMethod('postal');
      toast({
        title: "Location found",
        description: `Coordinates: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Location error",
        description: error instanceof Error ? error.message : "Failed to get location from postal code",
        variant: "destructive",
      });
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleUserSignup = async () => {
    if (!locationRequested) {
      setLocationRequested(true);
      return;
    }

    try {
      let finalLatitude = latitude;
      let finalLongitude = longitude;

      // Try postal code geocoding first if no GPS location
      if ((finalLatitude === null || finalLongitude === null) && postalCode.trim()) {
        if (!validatePostalCode(postalCode)) {
          toast({
            title: "Invalid postal code",
            description: "Please enter a valid 6-digit postal code",
            variant: "destructive",
          });
          return;
        }

        try {
          setGeocodingLoading(true);
          const result = await geocodePostalCode(postalCode);
          finalLatitude = result.latitude;
          finalLongitude = result.longitude;
          setLocationMethod('postal');
        } catch (error) {
          console.error('Geocoding error:', error);
          setLocationMethod('gps');
          // Fall back to GPS if geocoding fails
        } finally {
          setGeocodingLoading(false);
        }
      }

      // Fall back to GPS if postal code geocoding didn't work
      if (finalLatitude === null || finalLongitude === null) {
        requestLocation();
        // Wait for location to be retrieved
        await new Promise((resolve, reject) => {
          const checkLocation = () => {
            if (latitude !== null && longitude !== null) {
              resolve(true);
            } else if (locationError) {
              reject(new Error(locationError));
            } else {
              setTimeout(checkLocation, 100);
            }
          };
          checkLocation();
        });
        finalLatitude = latitude;
        finalLongitude = longitude;
      }

      if (finalLatitude === null || finalLongitude === null) {
        throw new Error("Unable to retrieve your location. Please enter a postal code or enable location services and try again.");
      }

      const registrationData = {
        email,
        password,
        firstName,
        lastName,
        address,
        phoneNumber: countryCode + phoneNumber,
        latitude: finalLatitude,
        longitude: finalLongitude,
      };
      console.log('Sending registration data:', registrationData);
      await registerCustomer(registrationData);
      toast({
        title: "Registration successful",
        description: "Welcome to FurryHub! You are now logged in.",
      });
      navigate('/');
      // Reset form
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setEmail("");
      setPassword("");
      setAddress("");
    } catch (error: unknown) {
      console.error('Registration error:', error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      console.error('Error response:', axiosError?.response);
      console.error('Error response data:', axiosError?.response?.data);
      let errorMessage = axiosError?.response?.data?.message ||
                        axiosError?.response?.data?.general ||
                        axiosError?.response?.data?.email ||
                        axiosError?.response?.data?.email ||
                        axiosError?.message ||
                        "Please try again.";

      // If errorMessage is still an object, stringify it or extract a value
      if (typeof errorMessage === 'object') {
        errorMessage = Object.values(errorMessage)[0] as string || "Please try again.";
      }
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/20 w-full max-w-md">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Create User Account
            </h2>
            <p className="text-gray-600 text-sm">
              Fill in your details to create your account
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-24 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+91">🇮🇳 +91</SelectItem>
                  <SelectItem value="+1">🇺🇸 +1</SelectItem>
                  <SelectItem value="+44">🇬🇧 +44</SelectItem>
                  <SelectItem value="+49">🇩🇪 +49</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="flex-1 h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 px-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              required
            />
            <p className="text-xs text-gray-600">
              Password must be at least 8 characters long
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Address <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Enter your complete address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="px-4 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 resize-none transition-colors"
              rows={3}
              required
            />
          </div>

          {/* Postal Code */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter 6-digit postal code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`flex-1 h-12 px-4 text-base rounded-xl border-2 focus:ring-0 ${
                  postalCode && !validatePostalCode(postalCode)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                maxLength={6}
                required
              />
              <Button
                type="button"
                onClick={handleGetLocationFromPostalCode}
                disabled={geocodingLoading || !postalCode.trim() || !validatePostalCode(postalCode)}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl h-12 whitespace-nowrap transition-colors"
              >
                {geocodingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Getting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Location
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Enter your 6-digit postal code to get exact location coordinates
              </p>
              {postalCode && (
                <span className={`text-xs font-medium ${
                  validatePostalCode(postalCode) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {postalCode.length}/6 digits
                </span>
              )}
            </div>
            {postalCode && !validatePostalCode(postalCode) && postalCode.length > 0 && (
              <p className="text-xs text-red-600">
                Please enter a valid 6-digit postal code
              </p>
            )}
          </div>

          {/* Location Permission */}
          {locationRequested && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                GPS location access (optional - postal code will be used if GPS fails)
              </p>
              <Button
                type="button"
                onClick={() => requestLocation()}
                variant="outline"
                disabled={locationLoading}
                className="flex items-center gap-2 mx-auto"
              >
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                {locationLoading ? "Getting GPS Location..." : "Allow GPS Location Access"}
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                {locationError ? (
                  <>
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">{locationError}</span>
                  </>
                ) : latitude && longitude ? (
                  <>
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">GPS location detected successfully</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>GPS location not available (postal code will be used)</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Create Account Button */}
          <Button
            onClick={handleUserSignup}
            disabled={!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !email.trim() || !password.trim() || !address.trim() || !postalCode.trim() || !validatePostalCode(postalCode) || geocodingLoading}
            className="w-full h-12 text-base font-medium rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {geocodingLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Getting Location from Postal Code...
              </>
            ) : locationLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Getting GPS Location...
              </>
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>

          {/* Terms and Privacy */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-600">
              By creating an account, you agree to our{" "}
              <button className="underline text-gray-900 hover:text-blue-600 transition-colors">
                Terms & Conditions
              </button>{" "}
              and{" "}
              <button className="underline text-gray-900 hover:text-blue-600 transition-colors">
                Privacy Policy
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
