import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, PawPrint } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { BookingModal } from "./BookingModal";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToBook?: () => void;
}

export const CartModal = ({ isOpen, onClose, onProceedToBook }: CartModalProps) => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const handleRemoveItem = async (packageId: number) => {
    try {
      await removeFromCart(packageId);
    } catch (error) {
      toast({
        title: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleClearCart = async () => {
    setIsLoading(true);
    try {
      await clearCart();
      toast({
        title: "Cart cleared",
      });
    } catch (error) {
      toast({
        title: "Failed to clear cart",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    // Cart modal doesn't have form fields, but we can reset any local state if needed
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleProceedToBook = () => {
    handleClose();
    setIsBookingModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-center text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <PawPrint className="w-5 h-5 text-orange-400" />
              Your Cart
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <PawPrint className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Your cart is empty. Add some pet services for your furry friend!</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.packageId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                        <p className="text-gray-600 text-xs capitalize">{item.type || 'Service'}</p>
                        <p className="text-green-600 font-bold text-sm">₹{item.price} x {item.qty}</p>
                      </div>
                      <Button
                        onClick={() => handleRemoveItem(item.packageId)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800">Total:</span>
                    <span className="font-bold text-green-600 text-lg">₹{getTotalPrice()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleProceedToBook}
                      className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 rounded-full"
                    >
                      Proceed to Book
                    </Button>
                    <Button
                      onClick={handleClearCart}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 font-semibold py-2 rounded-full"
                    >
                      {isLoading ? "Clearing..." : "Clear Cart"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        serviceName="Cart Services"
      />
    </>
  );
};
