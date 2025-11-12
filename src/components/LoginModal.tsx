import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup?: () => void;
}

export const LoginModal = ({ isOpen, onClose, onSignup }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { role } = await login(email, password);
      const roleDisplay = role === 'CUSTOMER' ? 'Customer' : 'Provider';
      toast({
        title: `Login successful as ${roleDisplay}`,
        description: `Welcome back! You are logged in as a ${roleDisplay.toLowerCase()}.`,
      });
      handleClose();
      // Navigation is handled in AuthContext based on role
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    onClose();
    if (onSignup) {
      onSignup();
    } else {
      navigate("/furry-squad-register"); // fallback
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 p-6">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            Welcome Back
          </DialogTitle>
          <p className="text-center text-gray-600 text-sm">
            Sign in to your account to continue
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
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

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={handleSignupRedirect}
                className="text-blue-600 hover:underline font-medium"
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
            <button
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-xs text-blue-600 hover:underline"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </DialogContent>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </Dialog>
  );
};
