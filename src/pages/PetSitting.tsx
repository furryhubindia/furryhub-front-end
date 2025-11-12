import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingModal } from "@/components/BookingModal";
import { CartModal } from "@/components/CartModal";
import { LoginModal } from "@/components/LoginModal";
import { SignupModal } from "@/components/SignupModal";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { providerApi, PackageRequestDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const PetSitting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [packages, setPackages] = useState<PackageRequestDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [packageMap, setPackageMap] = useState<Record<string, number>>({});
  const [hasAddedDefault, setHasAddedDefault] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const allPackages = await providerApi.getAllPackages();
        // Filter packages by type "Pet Sitting"
        const petSittingPackages = allPackages.filter(pkg => pkg.type === 'Pet Sitting');
        setPackages(petSittingPackages);

        const map: Record<string, number> = {};
        petSittingPackages.forEach(pkg => {
          map[pkg.name] = pkg.id!;
        });
        setPackageMap(map);

        // Only auto-open booking modal if specifically navigated from dashboard with pet selection
        if (location.state?.petId && typeof location.state.petId === 'number' && petSittingPackages.length > 0 && !hasAddedDefault && location.state.fromDashboard) {
          const defaultPackage = petSittingPackages[0];
          try {
            addToCart(defaultPackage.id!);
            setIsBookingModalOpen(true);
            setHasAddedDefault(true);
          } catch (error) {
            console.error('Failed to add to cart:', error);
            toast({
              title: "Failed to add to cart",
              description: "Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch pet sitting packages:', error);
        toast({
          title: "Failed to load packages",
          description: "Please refresh the page to try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, [location.state?.petId, addToCart, hasAddedDefault, location.state?.fromDashboard, toast]);

  const handleAddToCart = async (packageName: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const packageId = packageMap[packageName];
    if (!packageId) {
      toast({
        title: "Package not found",
        description: "This package is not available at the moment.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addToCart(packageId);
      toast({
        title: "Added to cart",
        description: `${packageName} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleBookService = async (pkg: PackageRequestDTO) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Add the package to cart first
    try {
      await addToCart(pkg.id);
      toast({
        title: "Package added",
        description: `${pkg.name} has been added to your cart.`,
      });
      // Then open the booking modal
      setIsBookingModalOpen(true);
    } catch (error) {
      toast({
        title: "Failed to add package",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const scrollToPackages = () => {
    const packagesSection = document.getElementById('packages-section');
    if (packagesSection) {
      packagesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };


  const whyChooseFeatures = [
    {
      title: "Verified Providers:",
      description: "All foster homes, dog walkers, and caretakers are thoroughly vetted.",
      icon: "✓"
    },
    {
      title: "Real-Time Updates",
      description: "Receive photos and progress reports during the service.",
      icon: "📱"
    },
    {
      title: "Safety First:",
      description: "Ensuring a secure and caring environment for your pets.",
      icon: "🛡️"
    },
    {
      title: "Convenience:",
      description: "Book services online or through our app at your convenience.",
      icon: "📅"
    },
    {
      title: "Wide Range of Services:",
      description: "Foster care, walking, training services for all types of pets.",
      icon: "🎯"
    }
  ];

  const faqs = [
    {
      question: "Q1. How does FurryHub ensure safety?",
      answer: "A1. All foster homes, walkers, and caretakers undergo a strict vetting process and background checks."
    },
    {
      question: "Q2. What types of pets are supported?",
      answer: "A2. We provide services for dogs, cats, rabbits, birds, and even horses."
    },
    {
      question: "Q3. How do I book a service?",
      answer: "A3. Use our website or app to select a service, provider, and schedule."
    },
    {
      question: "Q4. Are real-time updates available?",
      answer: "A4. Yes, we provide live updates, photos, and status reports during the service."
    },
    {
      question: "Q5. Can I meet the service provider beforehand?",
      answer: "A5. Yes, a meet-and-greet can be arranged for your peace of mind."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={() => navigate("/")} className="cursor-pointer">
              <img
                src="/lovable-uploads/1e65733e-72da-4657-999d-da4b9d32af9c.png"
                alt="FurryHub Logo"
                className="w-8 h-8 object-contain"
              />
            </button>
            <h1 className="text-2xl font-black text-gray-800">
              FURRY HOME
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleBookNow}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full"
            >
              Book now
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsCartModalOpen(true)}
              className="relative rounded-full bg-orange-400 hover:bg-orange-500 text-white hover:text-white w-10 h-10"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-200 to-red-200 rounded-3xl p-8 my-6 overflow-hidden">
          <div className="flex items-center gap-8">
            <div className="flex-1 relative z-10">
              <h2 className="text-3xl font-black text-gray-800 mb-2">ALL PETS, ALL <span className="text-red-600">CARE</span>,</h2>
              <h2 className="text-3xl font-black text-gray-800 mb-6">ALL TAILORED FOR <span className="text-red-600">COMFORT</span>!!</h2>
              <div className="flex gap-3">
                <Button 
                  onClick={scrollToPackages}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-full"
                >
                  Explore Packages
                </Button>
                <Button
                  onClick={handleBookNow}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-full"
                >
                  Book now
                </Button>
              </div>
            </div>
            <div className="w-80 h-60 flex-shrink-0">
              <img 
                src="/lovable-uploads/e30af2de-fbf2-48c5-bacd-eaf8e79f3570.png" 
                alt="Happy Dog" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="my-8">
          <h3 className="text-xl font-black text-gray-800 mb-4">MENU</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Connect with trusted foster houses, dog walkers, and pet caretakers near you.</li>
            <li>• Reliable and compassionate care for your pets.</li>
            <li>• Book services conveniently through FurryHub.</li>
          </ul>
        </div>

        {/* How It Works Section */}
        <div className="my-12">
          <h3 className="text-2xl font-black text-gray-800 text-center mb-8">HOW IT WORKS?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🏠</div>
              <div>
                <h4 className="font-bold text-gray-800">Verified Foster Homes</h4>
                <p className="text-sm text-gray-600">We connect you to licensed and loving foster homes, ensuring a safe and nurturing environment for your pets when you're away.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🚶‍♂️</div>
              <div>
                <h4 className="font-bold text-gray-800">Professional Dog Walkers</h4>
                <p className="text-sm text-gray-600">Schedule walks for your dogs with trained and responsible walkers who ensure exercise, safety, and companionship.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">👤</div>
              <div>
                <h4 className="font-bold text-gray-800">Dedicated Pet Caretakers</h4>
                <p className="text-sm text-gray-600">Hire experienced caretakers to look after your pets at home, giving them the care and attention they deserve.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📱</div>
              <div>
                <h4 className="font-bold text-gray-800">Hassle-Free Booking</h4>
                <p className="text-sm text-gray-600">Our platform simplifies the process of finding, reviewing, and booking services, all in one place.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FurryHub's Promise */}
        <div className="relative bg-gradient-to-br from-blue-200 to-cyan-200 rounded-3xl p-8 my-12 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-gray-800 mb-2">FURRYHUB'S PROMISE</h3>
              <h4 className="text-xl font-bold text-gray-800 mb-4">Care Beyond Boundaries</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                At FurryHub, we prioritize your pet's happiness and well-being. Whether you need a safe foster home, a reliable dog walker, or a dedicated caretaker, we ensure trusted connections and exceptional service, making pet care stress-free and seamless for you.
              </p>
            </div>
            <div className="w-64 h-64 flex items-center justify-center">
              <div className="text-8xl">🐕</div>
            </div>
          </div>
        </div>

        {/* Packages Section */}
        <div id="packages-section" className="my-12">
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-32 h-32 bg-orange-200 rounded-full -z-10"></div>
            <h3 className="text-2xl font-black text-gray-800 mb-8">PACKAGES:</h3>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-2xl">Loading packages...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {packages.length > 0 ? packages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <div className="text-2xl">🐕</div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-gray-800">{pkg.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 mb-3">₹{pkg.price}</div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddToCart(pkg.name)}
                          className="bg-purple-200 text-gray-800 font-semibold px-3 py-2 rounded-full hover:bg-purple-300 text-sm"
                        >
                          Add to Cart
                        </Button>
                        <Button
                          onClick={() => handleBookService(pkg)}
                          className="bg-green-400 text-gray-800 font-semibold px-3 py-2 rounded-full hover:bg-green-500 text-sm"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="text-2xl mb-4">📋</div>
                  <p className="text-gray-500">No pet sitting packages available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Why Choose FurryHub */}
        <div className="my-12">
          <div className="relative">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-200 rounded-full -z-10"></div>
            <h3 className="text-2xl font-black text-gray-800 mb-8">WHY CHOOSE FURRYHUB FOR SITTING?</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyChooseFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h4 className="font-bold text-gray-800">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="my-12">
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-32 h-32 bg-cyan-200 rounded-full -z-10"></div>
            <h3 className="text-2xl font-black text-gray-800 mb-8">FURRYHUB HOME FAQS</h3>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-2">{faq.question}</h4>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Book Now Section */}
        <div className="relative bg-gradient-to-br from-orange-400 to-red-400 rounded-3xl p-8 my-12 text-white text-center">
          <h3 className="text-3xl font-black mb-4">BOOK NOW..!!</h3>
          <p className="text-lg mb-2">Pet care at your fingertips, for any pet, anytime, anywhere.</p>
          <p className="text-lg">Let FurryHub help your companions feel loved and cared for with professional service.</p>
        </div>

        {/* Contact Section */}
        <div className="relative bg-orange-300 rounded-3xl p-8 my-12 text-center">
          <h4 className="font-bold text-gray-800 mb-2">Contact Us</h4>
          <p className="text-gray-700 mb-4">Email to furryhubindia@gmail.com</p>
          <p className="text-sm text-gray-700 mb-4">FurryHub: Your one-stop destination for all things pets—care, love, and convenience at your fingertips!</p>
          
          <Button className="bg-green-500 hover:bg-green-600 text-white mb-4">
            📱 Message us on WhatsApp
          </Button>
          
          <div className="flex justify-center space-x-4">
            <div className="text-2xl">📸</div>
            <div className="text-2xl">📘</div>
          </div>
          <p className="text-sm text-gray-700 mt-2">Social</p>
        </div>
      </div>

      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        onProceedToBook={handleBookNow}
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
};

export default PetSitting;