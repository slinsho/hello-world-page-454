/**
 * ============================================================
 *  APP.TSX  —  the "front door" of the whole app
 * ============================================================
 *  Plain-English summary:
 *
 *  1. Wraps the app in "providers" (shared boxes of data):
 *       - QueryClient    → caches database results
 *       - AuthProvider   → knows who is logged in
 *       - PlatformSettings / UserPreferences → site-wide config
 *  2. Sets up the URL router (which page shows for which URL).
 *  3. Mounts site-wide widgets that appear on every page:
 *       - Toaster / Sonner → little popup notifications
 *       - FeedbackButton, PWA prompts, OnboardingGuide
 *       - DebugPanel       → press Ctrl+Shift+D to open
 *
 *  If a whole-app feature breaks, it's usually one of these
 *  providers or the route definitions further down.
 * ============================================================
 */
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipToContent } from "@/components/SkipToContent";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import FeedbackButton from "@/components/FeedbackButton";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
// DebugPanel has been moved into the Admin Portal (Admin → Debug Console).

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
const About = lazy(() => import("./pages/About"));
const Agents = lazy(() => import("./pages/Agents"));
const Reels = lazy(() => import("./pages/Reels"));
const ExploreCounties = lazy(() => import("./pages/ExploreCounties"));
const CountyLanding = lazy(() => import("./pages/CountyLanding"));
const Hotels = lazy(() => import("./pages/Hotels"));
const HotelDetail = lazy(() => import("./pages/HotelDetail"));
const HotelRooms = lazy(() => import("./pages/HotelRooms"));
const HotelBooking = lazy(() => import("./pages/HotelBooking"));
const HotelDashboard = lazy(() => import("./pages/HotelDashboard"));
const WantToBuy = lazy(() => import("./pages/WantToBuy"));
const PropertyInspection = lazy(() => import("./pages/PropertyInspection"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <PlatformSettingsProvider>
      <UserPreferencesProvider>
        <TooltipProvider>
          <SkipToContent />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <FeedbackButton />
            <PWAInstallPrompt />
            <PWAUpdatePrompt />
            <OnboardingGuide />
            {/* Debug console now lives at /winner-54/dashboard → Debug tab. */}
            <div id="main-content">
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>}>
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
                  <Route path="/about" element={<About />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/reels" element={<Reels />} />
                  <Route path="/explore-counties" element={<ExploreCounties />} />
                  <Route path="/county/:slug" element={<CountyLanding />} />
                  <Route path="/winner-54/login" element={<AdminLogin />} />
                  <Route path="/winner-54/dashboard" element={<Suspense fallback={null}><AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute></Suspense>} />
                  <Route path="/winner-54/listings" element={<Suspense fallback={null}><AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute></Suspense>} />
                  <Route path="/winner-54/users" element={<Suspense fallback={null}><AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute></Suspense>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </UserPreferencesProvider>
      </PlatformSettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
