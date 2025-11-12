import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PawPrint, Loader2 } from "lucide-react";
import { customerApi, PetDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetAdded: () => void;
  petToEdit?: PetDTO | null;
}

export const AddPetModal = ({ isOpen, onClose, onPetAdded, petToEdit }: AddPetModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [petData, setPetData] = useState({
    name: "",
    breed: "",
    gender: "",
    weight: "",
    age: "",
    color: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (petToEdit) {
      setPetData({
        name: petToEdit.name,
        breed: petToEdit.breed,
        gender: petToEdit.gender,
        weight: petToEdit.weight ? petToEdit.weight.toString() : "",
        age: petToEdit.age ? petToEdit.age.toString() : "",
        color: petToEdit.color || ""
      });
    } else {
      setPetData({
        name: "",
        breed: "",
        gender: "",
        weight: "",
        age: "",
        color: ""
      });
    }
  }, [petToEdit]);

  const handleInputChange = (field: string, value: string) => {
    setPetData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setPetData({
      name: "",
      breed: "",
      gender: "",
      weight: "",
      age: "",
      color: ""
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitPet = async () => {
    if (!user) {
      setError("You must be logged in to add or update a pet.");
      return;
    }

    if (!petData.name || !petData.breed || !petData.gender) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert weight and age to number if provided
      const petToSubmit = {
        ...petData,
        weight: petData.weight ? parseFloat(petData.weight) : undefined,
        age: petData.age ? parseInt(petData.age) : undefined
      };

      if (petToEdit) {
        await customerApi.updatePet(petToEdit.id, { ...petToSubmit, id: petToEdit.id });
        toast({
          title: "Success",
          description: "Pet updated successfully"
        });
      } else {
        await customerApi.addPet(petToSubmit);
        toast({
          title: "Success",
          description: "Pet added successfully"
        });
      }
      onPetAdded();
      handleClose();
    } catch (err) {
      setError(`Failed to ${petToEdit ? 'update' : 'add'} pet. Please try again.`);
      console.error(`Error ${petToEdit ? 'updating' : 'adding'} pet:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <PawPrint className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            {petToEdit ? 'Edit Pet Details' : 'No pets added yet'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm mt-2">
            {petToEdit ? 'Update your pet information' : 'Please add your pet details to get started!'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="petName">Pet Name *</Label>
            <Input
              id="petName"
              placeholder="Enter your pet's name"
              value={petData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="breed">Breed *</Label>
            <Input
              id="breed"
              placeholder="e.g., Golden Retriever"
              value={petData.breed}
              onChange={(e) => handleInputChange("breed", e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gender *</Label>
              <Select onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g., 2"
                value={petData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="e.g., 25"
                value={petData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="e.g., Brown"
                value={petData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmitPet}
            disabled={!petData.name || !petData.breed || !petData.gender || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {petToEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              petToEdit ? 'Update Pet' : 'Add Pet'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
