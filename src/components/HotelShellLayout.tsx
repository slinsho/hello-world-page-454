import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, BedDouble, CalendarCheck, User, Bell, Menu, Settings, ShieldCheck, LogOut, HelpCircle, MessageSquare, BarChart3, CalendarRange, TrendingUp, QrCode, Star, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

const ownerNavItems = [
  { to: "/hotel-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hotel-dashboard/hotels", label: "Hotels", icon: Building2 },
  { to: "/hotel-dashboard/rooms", label: "Rooms", icon: BedDouble },
  { to: "/hotel-dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/hotel-dashboard/account", label: "Account", icon: User },
];

// Receptionists only handle bookings + check-in/out.
const staffNavItems = [
  { to: "/hotel-dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/hotel-dashboard/check-in", label: "Check-in", icon: QrCode },
];

const HotelShellLayout = ({ children, title, subtitle, showHeader = true }: Props) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const isStaff = profile?.role === "receptionist";
  const navItems = isStaff ? staffNavItems : ownerNavItems;

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    (supabase.from("notifications" as any) as any).select("title,message,is_read")
      .eq("user_id", user.id).eq("is_read", false)
      .then(({ data }: any) => {
        const re = /(hotel|room|booking|reservation|check-?in|check-?out|guest)/i;
        const n = (data || []).filter((x: any) => re.test(`${x.title} ${x.message}`)).length;
        setUnread(n);
      }, () => {});
  }, [user]);

  const active = (to: string) =>
    to === "/hotel-dashboard" ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {showHeader && (
        <header className="bg-background border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button aria-label="Menu" className="mt-1 text-muted-foreground">
                    <Menu className="w-6 h-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                  <SheetHeader className="p-5 border-b bg-gradient-to-br from-primary/10 to-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold">
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile?.full_name || "H")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <SheetTitle className="text-base truncate">{profile?.full_name || profile?.company_name || "Hotel Owner"}</SheetTitle>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <SheetDescription className="sr-only">Hotel dashboard navigation menu</SheetDescription>
                  </SheetHeader>
                  <div className="p-2">
                    {(isStaff ? [
                      { to: "/hotel-dashboard/bookings", label: "Bookings", icon: CalendarCheck, color: "bg-amber-500" },
                      { to: "/hotel-dashboard/check-in", label: "Check-in / QR", icon: QrCode, color: "bg-cyan-500" },
                    ] : [
                      { to: "/hotel-dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-blue-500" },
                      { to: "/hotel-dashboard/hotels", label: "My Hotels", icon: Building2, color: "bg-emerald-500" },
                      { to: "/hotel-dashboard/rooms", label: "Rooms", icon: BedDouble, color: "bg-violet-500" },
                      { to: "/hotel-dashboard/bookings", label: "Bookings", icon: CalendarCheck, color: "bg-amber-500" },
                      { to: "/hotel-dashboard/calendar", label: "Calendar & Availability", icon: CalendarRange, color: "bg-indigo-500" },
                      { to: "/hotel-dashboard/pricing", label: "Pricing Rules", icon: TrendingUp, color: "bg-pink-500" },
                      { to: "/hotel-dashboard/check-in", label: "Check-in / QR", icon: QrCode, color: "bg-cyan-500" },
                      { to: "/hotel-dashboard/reviews", label: "Reviews", icon: Star, color: "bg-yellow-500" },
                      { to: "/hotel-dashboard/analytics", label: "Analytics", icon: BarChart3, color: "bg-teal-500" },
                      { to: "/hotel-dashboard/staff", label: "Receptionists", icon: Users, color: "bg-rose-500" },
                    ]).map((it) => {
                      const Icon = it.icon;
                      return (
                        <button
                          key={it.to}
                          onClick={() => { setMenuOpen(false); navigate(it.to); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left"
                        >
                          <div className={`w-8 h-8 rounded-[10px] ${it.color} text-white flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[15px] font-medium">{it.label}</span>
                        </button>
                      );
                    })}
                    <div className="border-t my-2" />
                    <button
                      onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-destructive text-left"
                    >
                      <div className="w-8 h-8 rounded-[10px] bg-destructive/10 text-destructive flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] font-medium">Sign Out</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{subtitle || "Welcome back,"}</p>
                <h1 className="text-xl md:text-2xl font-bold truncate">
                  {title || profile?.name || profile?.full_name || (isStaff ? "Receptionist" : "Hotel Owner")} <span aria-hidden>👋</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Here's what's happening today.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!isStaff && (
              <button
                onClick={() => navigate("/hotel-dashboard/notifications")}
                className="relative p-2 rounded-full hover:bg-muted"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              )}
              <button
                onClick={() => navigate(isStaff ? "/profile" : "/hotel-dashboard/account")}
                className="w-10 h-10 rounded-full bg-muted overflow-hidden ring-2 ring-primary/20"
                aria-label="Account"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold">
                    {(profile?.full_name || "H")[0].toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-md md:max-w-2xl mx-auto px-4 py-4">{children}</main>

      {/* Hotel bottom navigation — persistent across all hotel pages */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom,0)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className={`grid ${navItems.length === 2 ? "grid-cols-2" : "grid-cols-5"} max-w-6xl mx-auto`}>
          {navItems.map((n) => {
            const Icon = n.icon;
            const isActive = active(n.to);
            return (
              <button
                key={n.to}
                onClick={() => navigate(n.to)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`w-10 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-primary/10" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={isActive ? "font-semibold" : ""}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default HotelShellLayout;