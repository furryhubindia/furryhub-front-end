import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGeolocationOnRequest } from "@/hooks/useGeolocationOnRequest";
import { geocodePostalCode, validatePostalCode } from "@/utils/geocoding";

export const FurrySquadRegister = () => {
  const navigate = useNavigate();
  const { registerProvider } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fieldType: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    address: "",
    city: "",
    postalCode: "",
    personalContact: "",
    houseVisit: "",
    businessContact: "",
    experience: "",
    rating: "",
    petClinicName: "",
    petClinicLocation: "",
    specialization: "",
    licenseNumber: "",
    online: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'postal' | 'gps'>('postal');
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useGeolocationOnRequest();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    if (field === 'postalCode' && errors.postalCode) {
      setErrors(prev => ({ ...prev, postalCode: "" }));
    }
  };

  const handleGetLocationFromPostalCode = async () => {
    if (!formData.postalCode.trim()) {
      setErrors(prev => ({ ...prev, postalCode: "Please enter a postal code" }));
      return;
    }

    if (!validatePostalCode(formData.postalCode)) {
      setErrors(prev => ({ ...prev, postalCode: "Please enter a valid 6-digit postal code" }));
      return;
    }

    setGeocodingLoading(true);
    try {
      const result = await geocodePostalCode(formData.postalCode);
      setLocationMethod('postal');

      toast({
        title: "Location found",
        description: `Coordinates: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        postalCode: error instanceof Error ? error.message : "Failed to get location from postal code"
      }));
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let finalLatitude = latitude;
      let finalLongitude = longitude;

      if ((finalLatitude === null || finalLongitude === null) && formData.postalCode.trim()) {
        if (!validatePostalCode(formData.postalCode)) {
          setErrors(prev => ({ ...prev, postalCode: "Please enter a valid 6-digit postal code" }));
          return;
        }

        try {
          setGeocodingLoading(true);
          const result = await geocodePostalCode(formData.postalCode);
          finalLatitude = result.latitude;
          finalLongitude = result.longitude;
          setLocationMethod('postal');
        } catch {
          setLocationMethod('gps');
        } finally {
          setGeocodingLoading(false);
        }
      }

      if (finalLatitude === null || finalLongitude === null) {
        requestLocation();
      }

      const result = await registerProvider({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        specialization: formData.specialization || formData.fieldType,
        experience: parseInt(formData.experience) || 0,
        licenseNumber: formData.licenseNumber,
        petStoreName: formData.petClinicName,
        petClinicLocation: formData.petClinicLocation,
        phoneNumber: formData.personalContact,
        address: formData.address,
        rating: parseFloat(formData.rating) || 0.0,
        latitude,
        longitude,
      });

      if (result.success) {
        setShowSuccessDialog(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setErrors(result.errors || {});
        toast({
          title: "Registration failed",
          description: result.errors?.general || "Please check the form for errors.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">

      <div className="max-w-4xl mx-auto pt-16">
        <div className="bg-green-400 rounded-2xl p-8 shadow-2xl">

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {[
                ['FIELD TYPE:', (
                  <Select onValueChange={(v) => handleInputChange('fieldType', v)}><SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent><SelectItem value="veterinarian">Veterinarian</SelectItem><SelectItem value="groomer">Pet Groomer</SelectItem><SelectItem value="trainer">Pet Trainer</SelectItem><SelectItem value="sitter">Pet Sitter</SelectItem><SelectItem value="walker">Pet Walker</SelectItem></SelectContent></Select>
                )],
                ['FIRST NAME:', <Input value={formData.firstName} onChange={(e)=>handleInputChange('firstName',e.target.value)} className="bg-white h-12" />],
                ['LAST NAME:', <Input value={formData.lastName} onChange={(e)=>handleInputChange('lastName',e.target.value)} className="bg-white h-12" />],
                ['EMAIL:', <Input type="email" value={formData.email} onChange={(e)=>handleInputChange('email',e.target.value)} className="bg-white h-12" />],
                ['PASSWORD:', <Input type="password" value={formData.password} onChange={(e)=>handleInputChange('password',e.target.value)} className="bg-white h-12" />],
                ['ADDRESS:', <Input value={formData.address} onChange={(e)=>handleInputChange('address',e.target.value)} className="bg-white h-12" />],
                ['CITY:', <Input value={formData.city} onChange={(e)=>handleInputChange('city',e.target.value)} className="bg-white h-12" />],
                ['POSTAL CODE:', (
                  <div className="flex gap-2 flex-1">
                    <Input value={formData.postalCode} onChange={(e)=>handleInputChange('postalCode',e.target.value)} className="bg-white h-12 flex-1" maxLength={6}/>
                    <Button type="button" onClick={handleGetLocationFromPostalCode} disabled={geocodingLoading || !formData.postalCode.trim()} className="bg-green-600 h-12">{geocodingLoading ? "..." : "Locate"}</Button>
                  </div>
                )],
                ['PERSONAL CONTACT NUMBER:', <Input value={formData.personalContact} onChange={(e)=>handleInputChange('personalContact',e.target.value)} className="bg-white h-12" />],
              ].map(([label, input], idx)=>(
                <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <label className="text-black font-bold text-sm w-40 flex-shrink-0">{label}</label>
                  <div className="flex-1">{input}</div>
                </div>
              ))}

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {[
                ['BUSINESS CONTACT NUMBER:', <Input value={formData.businessContact} onChange={(e)=>handleInputChange('businessContact',e.target.value)} className="bg-white h-12" />],
                ['EXPERIENCE:', <Input value={formData.experience} onChange={(e)=>handleInputChange('experience',e.target.value)} className="bg-white h-12" placeholder="Years" />],
                ['RATING:', <Input value={formData.rating} onChange={(e)=>handleInputChange('rating',e.target.value)} className="bg-white h-12" placeholder="0.0" />],
                ['PET CLINIC / STORE NAME:', <Input value={formData.petClinicName} onChange={(e)=>handleInputChange('petClinicName',e.target.value)} className="bg-white h-12" />],
                ['CLINIC / STORE LOCATION:', <Input value={formData.petClinicLocation} onChange={(e)=>handleInputChange('petClinicLocation',e.target.value)} className="bg-white h-12" />],
                ['SPECIALIZATION:', <Input value={formData.specialization} onChange={(e)=>handleInputChange('specialization',e.target.value)} className="bg-white h-12" />],
                ['LICENSE NUMBER:', <Input value={formData.licenseNumber} onChange={(e)=>handleInputChange('licenseNumber',e.target.value)} className="bg-white h-12" />],
                ['HOUSE VISIT:', (
                  <Select onValueChange={(v)=>handleInputChange('houseVisit',v)}>
                    <SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                )],
                ['ONLINE (DOCTORS ONLY):', (
                  <Select onValueChange={(v)=>handleInputChange('online',v)}>
                    <SelectTrigger className="bg-white h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="not-available">Not Available</SelectItem></SelectContent>
                  </Select>
                )],
              ].map(([label, input], idx)=>(
                <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <label className="text-black font-bold text-sm w-40 flex-shrink-0">{label}</label>
                  <div className="flex-1">{input}</div>
                </div>
              ))}
            </div>

            {/* SUBMIT */}
            <div className="col-span-1 md:col-span-2 flex justify-center mt-8">
              <Button type="submit" disabled={locationLoading||geocodingLoading} className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-3 rounded-lg text-lg">
                {locationLoading ? "Getting Location..." : geocodingLoading ? "Processing..." : "Register"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FurrySquadRegister;
  