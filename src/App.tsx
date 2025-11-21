import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import FeedbackButton from "@/components/FeedbackButton";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import PropertyDetail from "./pages/PropertyDetail";
import Verification from "./pages/Verification";
import Admin from "./pages/Admin";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FeedbackButton />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
