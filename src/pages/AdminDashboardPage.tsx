import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminVerifications } from "@/components/admin/AdminVerifications";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminProperties } from "@/components/admin/AdminProperties";
import AdminFeedback from "@/components/admin/AdminFeedback";
import { AdminPromotions } from "@/components/admin/AdminPromotions";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminRateSettings } from "@/components/admin/AdminRateSettings";
import { AdminMarketing } from "@/components/admin/AdminMarketing";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminBlog } from "@/components/admin/AdminBlog";
import { AdminContentModeration } from "@/components/admin/AdminContentModeration";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Determine default tab based on route
  const getDefaultTab = () => {
    if (location.pathname.includes("/listings")) return "properties";
    if (location.pathname.includes("/users")) return "users";
    return "dashboard";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out of the admin portal.",
    });
    navigate("/winner-54/login");
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case "dashboard":
        navigate("/winner-54/dashboard");
        break;
      case "properties":
        navigate("/winner-54/listings");
        break;
      case "users":
        navigate("/winner-54/users");
        break;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Admin Portal</h1>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      <Tabs defaultValue={getDefaultTab()} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full h-auto">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-2 sm:px-3">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-3">Analytics</TabsTrigger>
            <TabsTrigger value="moderation" className="text-xs sm:text-sm px-2 sm:px-3">Moderation</TabsTrigger>
            <TabsTrigger value="verifications" className="text-xs sm:text-sm px-2 sm:px-3">Verifications</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-3">Users</TabsTrigger>
            <TabsTrigger value="properties" className="text-xs sm:text-sm px-2 sm:px-3">Properties</TabsTrigger>
            <TabsTrigger value="blog" className="text-xs sm:text-sm px-2 sm:px-3">Blog</TabsTrigger>
            <TabsTrigger value="promotions" className="text-xs sm:text-sm px-2 sm:px-3">Promotions</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 sm:px-3">Reports</TabsTrigger>
            <TabsTrigger value="marketing" className="text-xs sm:text-sm px-2 sm:px-3">Marketing</TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs sm:text-sm px-2 sm:px-3">Feedback</TabsTrigger>
            <TabsTrigger value="rates" className="text-xs sm:text-sm px-2 sm:px-3">Rates</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="moderation">
          <AdminContentModeration />
        </TabsContent>

        <TabsContent value="verifications">
          <AdminVerifications />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="properties">
          <AdminProperties />
        </TabsContent>

        <TabsContent value="blog">
          <AdminBlog />
        </TabsContent>

        <TabsContent value="promotions">
          <AdminPromotions />
        </TabsContent>
        <TabsContent value="reports">
          <AdminReports />
        </TabsContent>

        <TabsContent value="marketing">
          <AdminMarketing />
        </TabsContent>

        <TabsContent value="feedback">
          <AdminFeedback />
        </TabsContent>

        <TabsContent value="rates">
          <AdminRateSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
