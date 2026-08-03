import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, Settings as SettingsIcon, Bell, LogOut, User as UserIcon,
  FileText, HelpCircle, ChevronRight, Wallet, Info, Camera, Star, Building2, CalendarCheck,
} from "lucide-react";

const HotelAccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ hotels: 0, bookings: 0, rating: 0 });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    (async () => {
      const { data: h } = await supabase.from("hotels").select("id,star_rating").eq("owner_id", user.id);
      const ids = (h || []).map((x: any) => x.id);
      let bookings = 0;
      if (ids.length) {
        const { count } = await supabase.from("hotel_bookings").select("id", { count: "exact", head: true }).in("hotel_id", ids);
        bookings = count || 0;
      }
      const ratings = (h || []).map((x: any) => Number(x.star_rating) || 0).filter(Boolean);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      setStats({ hotels: (h || []).length, bookings, rating: Number(avg.toFixed(1)) });
    })();
  }, [user, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate("/auth");
  };

  const groups: { title: string; items: any[] }[] = [
    {
      title: "Account",
      items: [
        { label: "Edit profile", icon: UserIcon, tone: "bg-blue-500", onClick: () => navigate("/hotel-dashboard/edit-profile") },
        { label: "Verification", icon: ShieldCheck, tone: "bg-emerald-500", onClick: () => navigate("/verification"), badge: profile?.verification_status },
        { label: "Payments", icon: Wallet, tone: "bg-amber-500", onClick: () => navigate("/hotel-dashboard/bookings") },
        { label: "Notifications", icon: Bell, tone: "bg-rose-500", onClick: () => navigate("/hotel-dashboard/notifications") },
      ],
    },
    {
      title: "Preferences",
      items: [
        { label: "Settings", icon: SettingsIcon, tone: "bg-slate-500", onClick: () => navigate("/settings") },
        { label: "Terms & Privacy", icon: FileText, tone: "bg-indigo-500", onClick: () => navigate("/terms") },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help & Feedback", icon: HelpCircle, tone: "bg-purple-500", onClick: () => navigate("/feedback") },
        { label: "About", icon: Info, tone: "bg-cyan-500", onClick: () => navigate("/about") },
      ],
    },
  ];

  return (
    <HotelShellLayout showHeader={false}>
      {/* Top bar */}
      <div className="pt-3 pb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Account</h1>
        <button
          onClick={() => navigate("/hotel-dashboard/notifications")}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-95 transition"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Centered profile hero — no overlapping */}
      <div className="flex flex-col items-center text-center pb-5">
        <button
          onClick={() => navigate("/hotel-dashboard/edit-profile")}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 p-[3px] active:scale-95 transition"
        >
          <div className="w-full h-full rounded-full bg-background overflow-hidden flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-2 ring-background shadow">
            <Camera className="w-3.5 h-3.5" />
          </span>
        </button>

        <div className="flex items-center gap-1.5 mt-3">
          <p className="text-[17px] font-bold leading-tight max-w-[240px] truncate">
            {profile?.full_name || profile?.company_name || "Hotel Owner"}
          </p>
          {profile?.verification_status === "approved" && (
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5 max-w-[260px] truncate">
          {profile?.email || user?.email}
        </p>
        <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full px-2.5 py-1">
          Hotel Owner
        </span>
      </div>

      {/* Stats — separate row, breathes */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {[
          { icon: Building2, label: "Hotels", value: stats.hotels, tone: "text-blue-500 bg-blue-500/10" },
          { icon: CalendarCheck, label: "Bookings", value: stats.bookings, tone: "text-emerald-500 bg-emerald-500/10" },
          { icon: Star, label: "Rating", value: stats.rating || "—", tone: "text-amber-500 bg-amber-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-background border p-3 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.tone}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[17px] font-bold mt-1.5 leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Grouped iOS-style lists */}
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-4 mb-2">
              {g.title}
            </p>
            <div className="rounded-2xl bg-background border overflow-hidden">
              {g.items.map((r: any, i: number) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.label}
                    onClick={r.onClick}
                    className={`w-full flex items-center gap-3 pl-3 pr-3 py-3 active:bg-muted/60 text-left ${i > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-[10px] ${r.tone} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="flex-1 text-[14px] font-medium truncate">{r.label}</span>
                    {r.badge && (
                      <span className="text-[10px] text-muted-foreground capitalize truncate max-w-[80px]">{r.badge}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={signOut}
          className="w-full rounded-2xl bg-background border py-3.5 flex items-center justify-center gap-2 text-destructive text-[14px] font-semibold active:bg-muted/60"
        >
          <LogOut className="w-4 h-4" />Sign Out
        </button>

        <p className="text-center text-[11px] text-muted-foreground pt-1 pb-2">Version 1.0.0</p>
      </div>
    </HotelShellLayout>
  );
};

export default HotelAccountPage;