import { User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { useAuth } from "@/contexts/AuthContext";


interface HeaderProps {
  onSignupClick?: () => void;
}

export const Header = ({ onSignupClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const shouldOpenLogin = localStorage.getItem('openLoginModal');
    if (shouldOpenLogin === 'true') {
      setIsLoginOpen(true);
      localStorage.removeItem('openLoginModal');
    }
  }, []);

  const services = [
    { name: "Grooming", path: "/grooming", description: "Professional pet grooming services" },
    { name: "Training", path: "/training", description: "Expert pet training programs" },
    { name: "Pet Sitting", path: "/pet-sitting", description: "Reliable pet sitting services" },
    { name: "Vet On Call", path: "/vet-on-call", description: "24/7 veterinary consultations" },
    { name: "Pet Adoption", path: "#", description: "Find your perfect furry companion through our adoption services" },
    { name: "Tracking", path: "#", description: "GPS tracking solutions to keep your pets safe" },
    { name: "Mating", path: "#", description: "Responsible breeding and mating services for pets" },
    { name: "Cab A Pet", path: "#", description: "Safe and reliable pet transportation services" }
  ];

  const handleServiceClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            if (isAuthenticated) {
              setShowLogoutConfirm(true);
            } else {
              navigate("/");
            }
          }}
        >
          <img 
            src="/lovable-uploads/1e65733e-72da-4657-999d-da4b9d32af9c.png" 
            alt="FurryHub Logo" 
            className="w-12 h-12 md:w-14 md:h-14 object-contain"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            FurryHub
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-700 hidden md:block">
                Welcome, {user?.firstName || user?.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full bg-red-500 hover:bg-red-600 text-white hover:text-white w-10 h-10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setIsLoginOpen(true)}
                className="text-gray-700 hover:bg-gray-100 px-4 py-2"
              >
                Login
              </Button>
              <Button
                variant="ghost"
                onClick={onSignupClick}
                className="text-gray-700 hover:bg-gray-100 px-4 py-2"
              >
                Register
              </Button>
            </>
          )}
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-700 hover:bg-gray-100 w-10 h-10"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Our Services</h2>
                <div className="flex flex-col space-y-4 max-h-96 overflow-y-auto px-4">
                  {services.map((service) => (
                    <button
                      key={service.path}
                      onClick={() => handleServiceClick(service.path)}
                      className="flex flex-col items-start p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                    >
                      <h3 className="font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSignup={onSignupClick}
      />

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-800">
              Confirm Logout
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-6">
              You are currently logged in. To access the homepage, you need to logout first.
            </p>
            <p className="text-sm text-gray-500">
              Do you want to logout and go to the homepage?
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                logout();
                setShowLogoutConfirm(false);
                navigate("/");
              }}
              className="flex-1 bg-orange-400 hover:bg-orange-500 text-white"
            >
              Logout & Go Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};
