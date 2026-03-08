import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminVerifications } from "@/components/admin/AdminVerifications";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminProperties } from "@/components/admin/AdminProperties";
import AdminFeedback from "@/components/admin/AdminFeedback";
import { AdminPromotions } from "@/components/admin/AdminPromotions";
import { AdminActivePromotions } from "@/components/admin/AdminActivePromotions";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminRateSettings } from "@/components/admin/AdminRateSettings";
import { AdminMarketing } from "@/components/admin/AdminMarketing";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminBlog } from "@/components/admin/AdminBlog";
import { AdminContentModeration } from "@/components/admin/AdminContentModeration";
import { AdminVerifiedDocuments } from "@/components/admin/AdminVerifiedDocuments";
import { AdminLegalPages } from "@/components/admin/AdminLegalPages";
import { AdminAboutPage } from "@/components/admin/AdminAboutPage";
import { Shield, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

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
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-3 border-b">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b last:border-b-0 ${!n.is_read ? "bg-primary/5" : ""}`}>
                      <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
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
            <TabsTrigger value="active-promos" className="text-xs sm:text-sm px-2 sm:px-3">Active Promos</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 sm:px-3">Reports</TabsTrigger>
            <TabsTrigger value="marketing" className="text-xs sm:text-sm px-2 sm:px-3">Marketing</TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs sm:text-sm px-2 sm:px-3">Feedback</TabsTrigger>
            <TabsTrigger value="verified-docs" className="text-xs sm:text-sm px-2 sm:px-3">Verified Docs</TabsTrigger>
            <TabsTrigger value="rates" className="text-xs sm:text-sm px-2 sm:px-3">Rates</TabsTrigger>
            <TabsTrigger value="legal" className="text-xs sm:text-sm px-2 sm:px-3">Legal</TabsTrigger>
            <TabsTrigger value="about" className="text-xs sm:text-sm px-2 sm:px-3">About</TabsTrigger>
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
        <TabsContent value="active-promos">
          <AdminActivePromotions />
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

        <TabsContent value="verified-docs">
          <AdminVerifiedDocuments />
        </TabsContent>

        <TabsContent value="rates">
          <AdminRateSettings />
        </TabsContent>

        <TabsContent value="legal">
          <AdminLegalPages />
        </TabsContent>

        <TabsContent value="about">
          <AdminAboutPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
