import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import FeedbackButton from "@/components/FeedbackButton";
import Index from "./pages/Index";
import NearMe from "./pages/NearMe";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import PropertyDetail from "./pages/PropertyDetail";
import Verification from "./pages/Verification";
import Admin from "./pages/Admin";
import Feedback from "./pages/Feedback";
import Notifications from "./pages/Notifications";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Messages from "./pages/Messages";
import OwnerDashboard from "./pages/OwnerDashboard";
import PopularAreasPage from "./pages/PopularAreasPage";

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
            <Route path="/near-me" element={<NearMe />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/popular-areas" element={<PopularAreasPage />} />
            {/* Hidden Admin Routes */}
            <Route path="/winner-54/login" element={<AdminLogin />} />
            <Route path="/winner-54/dashboard" element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            } />
            <Route path="/winner-54/listings" element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            } />
            <Route path="/winner-54/users" element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
