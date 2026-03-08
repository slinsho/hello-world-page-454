import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
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
import { AdminContactSubmissions } from "@/components/admin/AdminContactSubmissions";
import { Shield, LogOut, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({ verifications: 0, reports: 0, promotions: 0 });

  const getDefaultTab = () => {
    if (location.pathname.includes("/listings")) return "properties";
    if (location.pathname.includes("/users")) return "users";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());

  useEffect(() => {
    fetchNotifications();
    fetchPendingCounts();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCounts = async () => {
    const [v, r, p] = await Promise.all([
      supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("property_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("promotion_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    setPendingCounts({
      verifications: v.count || 0,
      reports: r.count || 0,
      promotions: p.count || 0,
    });
  };

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

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getTabForNotification = (notification: any): string => {
    const title = (notification.title || "").toLowerCase();
    const type = (notification.type || "").toLowerCase();
    if (title.includes("contact form")) return "contacts";
    if (title.includes("verification") || title.includes("verified")) return "verifications";
    if (title.includes("promotion") || title.includes("promoted") || title.includes("payment")) return "promotions";
    if (title.includes("report") || title.includes("flagged")) return "reports";
    if (title.includes("feedback")) return "feedback";
    if (title.includes("inquiry") || type === "inquiries") return "contacts";
    if (title.includes("offer") || type === "offers") return "feedback";
    if (title.includes("moderation")) return "moderation";
    return "dashboard";
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) markAsRead(notification.id);
    const tab = getTabForNotification(notification);
    setActiveTab(tab);
    setPopoverOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You've been signed out of the admin portal." });
    navigate("/winner-54/login");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setNavOpen(false);
    switch (value) {
      case "dashboard": navigate("/winner-54/dashboard"); break;
      case "properties": navigate("/winner-54/listings"); break;
      case "users": navigate("/winner-54/users"); break;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <AdminDashboard onNavigateTab={handleTabChange} />;
      case "analytics": return <AdminAnalytics />;
      case "moderation": return <AdminContentModeration />;
      case "verifications": return <AdminVerifications />;
      case "users": return <AdminUsers />;
      case "properties": return <AdminProperties />;
      case "blog": return <AdminBlog />;
      case "promotions": return <AdminPromotions />;
      case "active-promos": return <AdminActivePromotions />;
      case "reports": return <AdminReports />;
      case "marketing": return <AdminMarketing />;
      case "feedback": return <AdminFeedback />;
      case "verified-docs": return <AdminVerifiedDocuments />;
      case "rates": return <AdminRateSettings />;
      case "legal": return <AdminLegalPages />;
      case "about": return <AdminAboutPage />;
      case "contacts": return <AdminContactSubmissions />;
      default: return <AdminDashboard onNavigateTab={handleTabChange} />;
    }
  };

  const navigationSidebar = (
    <AdminNavigation
      activeTab={activeTab}
      onTabChange={handleTabChange}
      pendingCounts={pendingCounts}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4 pt-12">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-foreground">Navigation</h2>
                  </div>
                  {navigationSidebar}
                </SheetContent>
              </Sheet>
            )}
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
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
                <div className="flex items-center justify-between p-3 border-b border-border">
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
                      <div
                        key={n.id}
                        className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                        onClick={() => handleNotificationClick(n)}
                      >
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
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 border-r border-border p-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {navigationSidebar}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 py-4 md:px-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
