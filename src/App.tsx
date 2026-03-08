import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PlatformSettingsProvider } from "@/hooks/usePlatformSettings";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";
import { ScrollToTop } from "@/components/ScrollToTop";
import FeedbackButton from "@/components/FeedbackButton";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

// Lazy-loaded route components
const Index = lazy(() => import("./pages/Index"));
const NearMe = lazy(() => import("./pages/NearMe"));
const Auth = lazy(() => import("./pages/Auth"));
const Explore = lazy(() => import("./pages/Explore"));
const Upload = lazy(() => import("./pages/Upload"));
const Profile = lazy(() => import("./pages/Profile"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Verification = lazy(() => import("./pages/Verification"));
const Admin = lazy(() => import("./pages/Admin"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Favorites = lazy(() => import("./pages/Favorites"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminProtectedRoute = lazy(() => import("./components/admin/AdminProtectedRoute"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Messages = lazy(() => import("./pages/Messages"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const OwnerPromotionDashboard = lazy(() => import("./pages/OwnerPromotionDashboard"));
const PopularAreasPage = lazy(() => import("./pages/PopularAreasPage"));
const EditProperty = lazy(() => import("./pages/EditProperty"));
const Settings = lazy(() => import("./pages/Settings"));
const FeaturedListings = lazy(() => import("./pages/FeaturedListings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <PlatformSettingsProvider>
    <UserPreferencesProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <FeedbackButton />
          <PWAInstallPrompt />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>}>
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
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner-promotions" element={<OwnerPromotionDashboard />} />
              <Route path="/popular-areas" element={<PopularAreasPage />} />
              <Route path="/edit-property/:id" element={<EditProperty />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/featured" element={<FeaturedListings />} />
              <Route path="/winner-54/login" element={<AdminLogin />} />
              <Route path="/winner-54/dashboard" element={<Suspense fallback={null}><AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute></Suspense>} />
              <Route path="/winner-54/listings" element={<Suspense fallback={null}><AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute></Suspense>} />
              <Route path="/winner-54/users" element={<Suspense fallback={null}><AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute></Suspense>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </UserPreferencesProvider>
    </PlatformSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
