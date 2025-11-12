import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import { Grooming } from "./pages/Grooming";
import Training from "./pages/Training";
import PetSitting from "./pages/PetSitting";
import VetOnCall from "./pages/VetOnCall";
import FurrySquadRegister from "./pages/FurrySquadRegister";
import UserRegister from "./pages/UserRegister";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import { FurrySquadDashboard } from "./pages/FurrySquadDashboard";
import { UserDashboard } from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/furry-squad-register" element={<FurrySquadRegister />} />
        <Route path="/user-register" element={<UserRegister />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/furry-squad-dashboard" element={<FurrySquadDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/grooming" element={<Grooming />} />
        <Route path="/training" element={<Training />} />
        <Route path="/pet-sitting" element={<PetSitting />} />
        <Route path="/vet-on-call" element={<VetOnCall />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
