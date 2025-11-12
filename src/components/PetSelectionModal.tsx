import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PawPrint, Plus } from "lucide-react";
import { PetDTO } from "@/lib/api";

type Pet = PetDTO;

interface PetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets: Pet[];
  serviceName: string;
  onPetSelected: (pet: Pet) => void;
  onAddNewPet: () => void;
}

export const PetSelectionModal = ({
  isOpen,
  onClose,
  pets,
  serviceName,
  onPetSelected,
  onAddNewPet
}: PetSelectionModalProps) => {
  const resetForm = () => {
    // PetSelectionModal doesn't have form fields, but we can reset any local state if needed
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handlePetSelect = (pet: Pet) => {
    onPetSelected(pet);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <PawPrint className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            Select Pet for {serviceName}
          </DialogTitle>
          <p className="text-center text-gray-600 text-sm mt-2">
            Choose which pet you'd like this service for
          </p>
        </DialogHeader>

        <div className="mt-6">
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              {pets.map((pet) => (
                <Card
                  key={pet.id}
                  className="p-4 cursor-pointer border-gray-200 hover:border-gray-300 transition-colors"
                  onClick={() => handlePetSelect(pet)}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{pet.name}</h3>
                    <p className="text-gray-600 text-sm">{pet.breed}</p>
                    <div className="flex flex-col items-center space-y-1 mt-1">
                      <span className="text-xs text-gray-500">{pet.gender}</span>
                      {pet.weight && (
                        <span className="text-xs text-gray-500">{pet.weight} kg</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
