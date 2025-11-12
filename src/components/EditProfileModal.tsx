import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { providerApi, Provider } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Provider | null;
  onProfileUpdate: (updatedProfile: Provider) => void;
}

export const EditProfileModal = ({ isOpen, onClose, profile, onProfileUpdate }: EditProfileModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    specialization: "",
    experience: 0,
    licenseNumber: "",
    houseVisit: false,
    petStoreName: "",
    petClinicLocation: "",
    providerAddress: "",
    city: "",
    businessContactNumber: "",
    onlineService: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phoneNumber: profile.businessContactNumber || "",
        address: profile.providerAddress || "",
        specialization: profile.specialization || "",
        experience: profile.experience || 0,
        licenseNumber: profile.licenseNumber || "",
        houseVisit: profile.houseVisit || false,
        petStoreName: profile.petStoreName || "",
        petClinicLocation: profile.petClinicLocation || "",
        providerAddress: profile.providerAddress || "",
        city: profile.city || "",
        businessContactNumber: profile.businessContactNumber || "",
        onlineService: profile.onlineService || false,
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
      specialization: "",
      experience: 0,
      licenseNumber: "",
      houseVisit: false,
      petStoreName: "",
      petClinicLocation: "",
      providerAddress: "",
      city: "",
      businessContactNumber: "",
      onlineService: false,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        firstName: formData.firstName,
        lastName: formData.lastName,
        businessContactNumber: formData.phoneNumber,
        providerAddress: formData.address,
        specialization: formData.specialization,
        experience: formData.experience,
        licenseNumber: formData.licenseNumber,
        houseVisit: formData.houseVisit,
        petStoreName: formData.petStoreName,
        petClinicLocation: formData.petClinicLocation,
        city: formData.city,
        onlineService: formData.onlineService,
      };

      const result = await providerApi.updateProviderProfile(updatedProfile);
      onProfileUpdate(result);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      handleClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Provider Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Select value={formData.specialization} onValueChange={(value) => handleInputChange("specialization", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VETERINARIAN">Veterinarian</SelectItem>
                  <SelectItem value="GROOMER">Groomer</SelectItem>
                  <SelectItem value="TRAINER">Trainer</SelectItem>
                  <SelectItem value="SITTER">Pet Sitter</SelectItem>
                  <SelectItem value="WALKER">Pet Walker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience">Experience (years)</Label>
              <Input
                id="experience"
                type="number"
                value={formData.experience}
                onChange={(e) => handleInputChange("experience", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="petStoreName">Pet Store/Clinic Name</Label>
            <Input
              id="petStoreName"
              value={formData.petStoreName}
              onChange={(e) => handleInputChange("petStoreName", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="petClinicLocation">Clinic Location</Label>
            <Textarea
              id="petClinicLocation"
              value={formData.petClinicLocation}
              onChange={(e) => handleInputChange("petClinicLocation", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="houseVisit"
                checked={formData.houseVisit}
                onChange={(e) => handleInputChange("houseVisit", e.target.checked)}
              />
              <Label htmlFor="houseVisit">House Visits Available</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="onlineService"
                checked={formData.onlineService}
                onChange={(e) => handleInputChange("onlineService", e.target.checked)}
              />
              <Label htmlFor="onlineService">Online Services Available</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
