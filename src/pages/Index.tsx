import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { SignupModal } from "@/components/SignupModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import winterBg from "@/assets/winter-background.jpg";
import groomingPet from "@/assets/grooming-pet.png";
import vetPet from "@/assets/vet-pet.png";
import trainingPet from "@/assets/training-pet.png";
import adoptionPet from "@/assets/adoption-pet.png";
import sittingPet from "@/assets/sitting-pet.png";
import homePet from "@/assets/home-pet.png";
import matingPet from "@/assets/mating-pet.png";
import trackingPet from "@/assets/tracking-pet.png";
import cabPet from "@/assets/cab-pet.png";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const services = [
    { title: "HOME", bgColor: "bg-furry-cyan", textColor: "text-white", image: homePet },
    { title: "GROOMING", bgColor: "bg-furry-orange", textColor: "text-white", image: groomingPet },
    { title: "VET ON CALL", bgColor: "bg-furry-lime", textColor: "text-white", image: vetPet },
    { title: "MATING", bgColor: "bg-furry-lime", textColor: "text-white", image: matingPet },
    { title: "TRACKING", bgColor: "bg-furry-red", textColor: "text-white", image: trackingPet },
    { title: "PET TRAINING", bgColor: "bg-furry-cyan", textColor: "text-white", image: trainingPet },
    { title: "PET ADOPTION", bgColor: "bg-furry-orange", textColor: "text-white", image: adoptionPet },
    { title: "PET SITTING", bgColor: "bg-furry-lime", textColor: "text-white", image: sittingPet },
    { title: "CAB A PET", bgColor: "bg-furry-red", textColor: "text-white", image: cabPet }
  ];

  return (
    <div className="min-h-screen bg-winter-bg relative overflow-hidden">
      {/* Winter Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${winterBg})` }}
      />
      
      {/* Floating Snowflakes Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-70 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header onSignupClick={() => setIsSignupModalOpen(true)} />
        
        <main className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section with Letter Styling */}
            <div className="text-center mb-12">
              <div className="relative flex justify-center items-center space-x-2 mb-8">
                {["F", "U", "R", "R", "Y", "H", "U", "B"].map((letter, index) => (
                  <div
                    key={index}
                    className="w-12 h-16 md:w-16 md:h-20 bg-white rounded-lg shadow-lg flex items-center justify-center text-2xl md:text-3xl font-bold text-gray-800 transform hover:scale-110 transition-transform duration-200 relative"
                    style={{
                      background: index % 2 === 0 
                        ? "linear-gradient(135deg, #00bcd4, #00acc1)" 
                        : "linear-gradient(135deg, #ff9800, #ff8f00)"
                    }}
                  >
                    <span className="text-white drop-shadow-md">{letter}</span>
                  </div>
                ))}
                
                {/* Animated Pet Animals */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Dog moving across letters */}
                  <div className="absolute top-[-20px] left-0 text-2xl animate-[moveAcrossLetters_8s_ease-in-out_infinite]">
                    🐕
                  </div>
                  {/* Cat moving in reverse */}
                  <div className="absolute bottom-[-20px] right-0 text-2xl animate-[moveAcrossLettersReverse_6s_ease-in-out_infinite_2s]">
                    🐱
                  </div>
                  {/* Rabbit jumping */}
                  <div className="absolute top-[-25px] left-1/4 text-xl animate-[jumpBetweenLetters_5s_ease-in-out_infinite_1s]">
                    🐰
                  </div>
                  {/* Bird flying */}
                  <div className="absolute top-[-30px] right-1/4 text-lg animate-[flyAcrossLetters_7s_ease-in-out_infinite_3s]">
                    🐦
                  </div>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {services.map((service, index) => (
                <ServiceCard
                  key={index}
                  title={service.title}
                  bgColor={service.bgColor}
                  textColor={service.textColor}
                  image={service.image}
                  onClick={() => {
                    if (service.title === "HOME") {
                      if (isAuthenticated) {
                        setShowLogoutConfirm(true);
                      } else {
                        navigate("/home");
                      }
                    } else if (service.title === "GROOMING") {
                      navigate("/grooming");
                    } else if (service.title === "PET TRAINING") {
                      navigate("/training");
                    } else if (service.title === "PET SITTING") {
                      navigate("/pet-sitting");
                    } else if (service.title === "VET ON CALL") {
                      navigate("/vet-on-call");
                    } else {
                      setSelectedService(service.title);
                      setIsModalOpen(true);
                    }
                  }}
                />
              ))}
            </div>

            {/* Decorative Pet Characters */}
            <div className="mt-16 flex justify-center items-center space-x-8">
              <div className="hidden md:flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🐕</span>
                </div>
                <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl">🐱</span>
                </div>
                <div className="w-18 h-18 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🐰</span>
                </div>
                <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl">🐦</span>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
      
      <ComingSoonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceName={selectedService}
      />
      
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
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
              You are currently logged in. To access the login page, you need to logout first.
            </p>
            <p className="text-sm text-gray-500">
              Do you want to logout and go to the login page?
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
                navigate("/home");
              }}
              className="flex-1 bg-orange-400 hover:bg-orange-500 text-white"
            >
              Logout & Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;