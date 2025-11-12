import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { BookingModal } from "@/components/BookingModal";
import { CartModal } from "@/components/CartModal";
import { LoginModal } from "@/components/LoginModal";
import { SignupModal } from "@/components/SignupModal";
import { useState, useEffect } from "react";
import { providerApi, PackageRequestDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const Grooming = () => {
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
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const allPackages = await providerApi.getAllPackages();
        // Filter packages by type "Grooming"
        const groomingPackages = allPackages.filter(pkg => pkg.type === 'Grooming');
        setPackages(groomingPackages);

        const map: Record<string, number> = {};
        groomingPackages.forEach(pkg => {
          map[pkg.name] = pkg.id!;
        });
        setPackageMap(map);

        // Only auto-open booking modal if specifically navigated from dashboard with pet selection
        if (location.state?.petId && typeof location.state.petId === 'number' && groomingPackages.length > 0 && !hasAddedDefault && location.state.fromDashboard) {
          const defaultPackage = groomingPackages[0];
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
        console.error('Failed to fetch grooming packages:', error);
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
    setIsAddingToCart(prev => ({ ...prev, [packageName]: true }));
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
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [packageName]: false }));
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={() => navigate("/")} className="p-2">
              <img src="/lovable-uploads/650b4201-0e0c-4044-b7c0-1e07ec1a5454.png" alt="FurryHub Logo" className="w-8 h-8 object-contain" />
            </button>
            <h1 className="text-2xl font-black text-gray-800">FURRY GROOMING</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCartModalOpen(true)}
              className="relative p-2"
            >
              <ShoppingCart className="w-6 h-6 text-gray-800" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <Button 
              onClick={handleBookNow}
              className="bg-purple-200 text-gray-800 font-semibold px-6 py-2 rounded-full hover:bg-purple-300"
            >
              Book now
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-200 to-orange-300 rounded-3xl p-8 my-6 overflow-hidden">
          <div className="flex items-center gap-8">
            <div className="flex-1 relative z-10">
              <h2 className="text-3xl font-black text-gray-800 mb-2">ALL PETS, ALL CARE,</h2>
              <h2 className="text-3xl font-black text-gray-800 mb-6">ALL AT YOUR DOORSTEP!</h2>
              <div className="flex gap-3">
                <Button 
                  onClick={() => document.getElementById('grooming-packages')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-green-400 text-gray-800 font-semibold px-6 py-2 rounded-full hover:bg-green-500"
                >
                  Explore Packages
                </Button>
                <Button 
                  onClick={handleBookNow}
                  className="bg-purple-200 text-gray-800 font-semibold px-6 py-2 rounded-full hover:bg-purple-300"
                >
                  Book now
                </Button>
              </div>
            </div>
            <div className="w-80 h-60 flex-shrink-0">
              <img src="/lovable-uploads/285eb637-2862-45cc-b3f3-34122144835e.png" alt="Two groomed poodles" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="my-8">
          <h3 className="text-xl font-black text-gray-800 mb-4">MENU</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Find the best groomers in your area.</li>
            <li>• Personalised grooming experiences for your pets.</li>
            <li>• Flexible booking options available.</li>
          </ul>
        </div>

        {/* How It Works Section */}
        <div className="my-12">
          <h3 className="text-2xl font-black text-gray-800 text-center mb-8">HOW IT WORKS?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✨</div>
              <div>
                <h4 className="font-bold text-gray-800">Professional Groomers</h4>
                <p className="text-sm text-gray-600">Connect with verified, experienced groomers for top-quality service.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📅</div>
              <div>
                <h4 className="font-bold text-gray-800">Effortless Scheduling</h4>
                <p className="text-sm text-gray-600">Book grooming appointments through our easy-to-use platform.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🏠</div>
              <div>
                <h4 className="font-bold text-gray-800">At your Convenience</h4>
                <p className="text-sm text-gray-600">Choose a groomer to come to your location or visit their facility.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">✂️</div>
              <div>
                <h4 className="font-bold text-gray-800">Clean and Hygienic</h4>
                <p className="text-sm text-gray-600">Ensure your pet's grooming is done with care, leaving them refreshed and happy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FurryHub's Promise */}
        <div className="relative bg-gradient-to-br from-green-200 to-green-300 rounded-3xl p-8 my-12 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-gray-800 mb-2">FURRYHUB'S PROMISE</h3>
              <h4 className="text-xl font-bold text-gray-800 mb-4">Stress-Free Grooming, Made Simple</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                At FurryHub, we believe every pet deserves premium grooming. 
                Whether you have a dog, cat, rabbit, bird, turtle, horse, or any other companion, 
                FurryHub connects you with expert groomers who understand your pet's unique needs. 
                Experience stress-free, professional grooming at your doorstep with services tailored to your pet.
              </p>
            </div>
            <div className="w-32 h-32">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="text-4xl">🐕</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grooming Packages */}
        <div className="my-12" id="grooming-packages">
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-32 h-32 bg-orange-200 rounded-full -z-10"></div>
            <h3 className="text-2xl font-black text-gray-800 mb-8">GROOMING PACKAGES:</h3>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-2xl">Loading packages...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {packages.length > 0 ? packages.map((pkg, index) => (
                <div key={pkg.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <div className="text-2xl">🐾</div>
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
                          disabled={isAddingToCart[pkg.name]}
                          className="bg-purple-200 text-gray-800 font-semibold px-3 py-2 rounded-full hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {isAddingToCart[pkg.name] ? "Adding..." : "Add to Cart"}
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
                  <div className="text-2xl mb-4">✂️</div>
                  <p className="text-gray-500">No grooming packages available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Why Choose FurryHub */}
        <div className="my-12">
          <div className="relative">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-green-200 rounded-full -z-10"></div>
            <h3 className="text-2xl font-black text-gray-800 mb-8">WHY CHOOSE FURRYHUB FOR GROOMING?</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🚪</div>
              <div>
                <h4 className="font-bold text-gray-800">Convenient</h4>
                <p className="text-sm text-gray-600">Doorstep service for a hassle-free experience.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📦</div>
              <div>
                <h4 className="font-bold text-gray-800">Customizable Packages</h4>
                <p className="text-sm text-gray-600">Tailor grooming to meet your pet's unique needs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">😌</div>
              <div>
                <h4 className="font-bold text-gray-800">Stress-Free</h4>
                <p className="text-sm text-gray-600">Familiar surroundings reduce stress for your pet.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🌿</div>
              <div>
                <h4 className="font-bold text-gray-800">Eco-Friendly Products</h4>
                <p className="text-sm text-gray-600">Gentle, natural grooming products ensure safety.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="font-bold text-gray-800">Expert Care</h4>
                <p className="text-sm text-gray-600">Certified groomers with specialised training for different pet types.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Process */}
        <div className="my-12">
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-32 h-32 bg-orange-200 rounded-full -z-10"></div>
            <h3 className="text-2xl font-black text-gray-800 mb-8">HOW IT WORKS?</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Schedule Your Appointment:</h4>
              <p className="text-gray-600 text-sm">Choose a package and book via our platform.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Groomer Arrives at Your Location:</h4>
              <p className="text-gray-600 text-sm">Groomers come equipped with all necessary tools.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Personalised Grooming:</h4>
              <p className="text-gray-600 text-sm">Services tailored to your pet's needs.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Spotless Finish:</h4>
              <p className="text-gray-600 text-sm">Clean grooming and tidy-up after the session.</p>
            </div>
          </div>
        </div>

        {/* Book Now CTA */}
        <div className="relative bg-gradient-to-br from-purple-200 to-purple-300 rounded-3xl p-8 my-12 text-center overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/20 rounded-full"></div>
          <h3 className="text-2xl font-black text-gray-800 mb-4">BOOK NOW..!!</h3>
          <p className="text-gray-700 font-semibold mb-2">Grooming at your fingertips, for any pet, anytime, anywhere.</p>
          <p className="text-gray-700 text-sm">Let FurryHub take care of your companions with love and expertise.</p>
        </div>

        {/* Contact Section */}
        <div className="bg-green-300 rounded-3xl p-6 my-12 text-center">
          <div className="mb-4">
            <h4 className="font-bold text-gray-800 mb-2">Contact Us</h4>
            <p className="text-sm text-gray-700">Email to furryhubindia@gmail.com</p>
          </div>
          <p className="text-xs text-gray-700 mb-4">FurryHub: Your one-stop destination for all things pets—care, love, and convenience at your fingertips!</p>
          
          <Button className="bg-green-500 text-white font-semibold px-6 py-2 rounded-full mb-4 hover:bg-green-600">
            💬 Message us on WhatsApp
          </Button>
          
          <div className="flex justify-center gap-4">
            <div className="w-8 h-8 bg-pink-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📷</span>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">f</span>
            </div>
          </div>
        </div>
      </div>
      
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
      <CartModal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)}
        onProceedToBook={handleBookNow}
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