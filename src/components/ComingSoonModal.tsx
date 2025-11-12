import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
}

export const ComingSoonModal = ({ isOpen, onClose, serviceName }: ComingSoonModalProps) => {
  const resetForm = () => {
    // ComingSoonModal doesn't have form fields, but we can reset any local state if needed
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {serviceName}
          </DialogTitle>
          <DialogDescription className="text-center mt-4">
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">🚀</div>
              <p className="text-lg font-semibold text-foreground">
                Coming Soon!
              </p>
              <p className="text-muted-foreground">
                We're working hard to bring you this amazing service. Stay tuned for updates!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};