import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { SignupModal } from "@/components/SignupModal";

export const Home = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { email, password, rememberMe });
    // Redirect to user dashboard after login
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with scattered pet items */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
        style={{
          backgroundImage: `url('/lovable-uploads/0b4385dc-4ddf-4402-b88a-08b903083912.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* FURRY HUB Title */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10">
        <img 
          src="/lovable-uploads/e76e84b6-f422-41cd-b3e6-263bd60bef36.png"
          alt="FURRY HUB"
          className="h-24 md:h-32 object-contain"
        />
      </div>

      {/* Left side pets */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <img 
          src="/lovable-uploads/594f34d6-cb2a-48ff-bb6b-b649cccc95e8.png"
          alt="Left pets"
          className="h-96 object-contain"
        />
      </div>

      {/* Right side pets */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <img 
          src="/lovable-uploads/ad5e3809-5e24-41d0-ba8c-bd39523ebd1b.png"
          alt="Right pets"
          className="h-96 object-contain"
        />
      </div>

      {/* Main Login Form */}
      <div className="flex items-center justify-center min-h-screen px-4 relative z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Welcome Back!
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Enter Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-6 text-lg rounded-full border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-6 text-lg rounded-full border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white"
                required
              />
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="rounded"
              />
              <label htmlFor="remember" className="text-gray-600 text-sm">
                Remember Me
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0"
            >
              Login
            </Button>
          </form>

          <div className="text-center mt-6 space-y-3">
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 font-medium"
              onClick={() => {/* Handle forgot password */}}
            >
              Forget Password?
            </button>
            <br />
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 font-medium"
              onClick={() => setIsSignupModalOpen(true)}
            >
              Create an Account!
            </button>
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 font-medium"
              onClick={() => navigate('/furry-squad-register')}
            >
              Signup for Furry Squad
            </button>
          </div>

          {/* Back to Home button */}
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="px-6 py-2 rounded-full border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <SignupModal 
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
};

export default Home;