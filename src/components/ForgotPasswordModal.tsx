import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";
import { Mail, ArrowLeft } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!email) {
      toast({
        title: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setIsSuccess(true);
      toast({
        title: "Password reset email sent successfully",
        description: "Please check your email for password reset instructions. The link will be valid for 24 hours.",
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Failed to send reset email",
        description: axiosError.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 p-6">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            {isSuccess ? "Check Your Email" : "Forgot Password"}
          </DialogTitle>
          <p className="text-center text-gray-600 text-sm">
            {isSuccess
              ? "We've sent password reset instructions to your email."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </p>
        </DialogHeader>

        {!isSuccess && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !email}
              className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        )}

        {isSuccess && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                If an account with that email exists, we've sent you a password reset link.
              </p>
            </div>

            <Button
              onClick={handleClose}
              className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
            >
              Back to Login
            </Button>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleClose}
            className="text-xs text-blue-600 hover:underline"
            disabled={isLoading}
          >
            Back to Login
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
