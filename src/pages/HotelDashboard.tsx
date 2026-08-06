import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HotelShellLayout from "@/components/HotelShellLayout";
import {
  Building2, BedDouble, CalendarCheck, Clock, ShieldCheck, Wallet,
  Plus, MapPin, Star, ChevronRight, Bed, Calendar as CalIcon, CreditCard, TrendingUp, Bell,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";

const HotelDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [range, setRange] = useState<"week" | "month">("week");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p);
      const { data: h } = await supabase.from("hotels").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
      setHotels(h || []);
      const hotelIds = (h || []).map((x: any) => x.id);
      if (hotelIds.length) {
        const [{ data: r }, { data: b }] = await Promise.all([
          supabase.from("hotel_rooms").select("*").in("hotel_id", hotelIds),
          supabase.from("hotel_bookings").select("*").in("hotel_id", hotelIds).order("created_at", { ascending: false }),
        ]);
        setRooms(r || []);
        setBookings(b || []);
      }
    })();
  }, [user, navigate]);

  const primaryHotel = hotels[0];
  const totalHotels = hotels.filter((h) => h.status === "active").length || hotels.length;
  const totalBookings = bookings.length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const now = new Date();
  const confirmedThisMonth = bookings.filter((b) => b.status === "confirmed" && new Date(b.created_at).getMonth() === now.getMonth()).length;
  // Revenue only counts once a guest has actually checked in.
  const revenueThisMonth = bookings
    .filter((b) => b.checked_in_at && new Date(b.checked_in_at).getMonth() === now.getMonth())
    .reduce((s, b) => s + Number(b.total || 0), 0);

  const chartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const start = new Date(); start.setDate(start.getDate() - 6);
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      return { day: days[d.getDay()], value: 0 };
    });
    bookings.forEach((b) => {
      const t = new Date(b.created_at).getTime();
      const idx = Math.floor((t - start.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (idx >= 0 && idx < 7) buckets[idx].value++;
    });
    return buckets;
  }, [bookings]);

  const totalRangeBookings = chartData.reduce((s, d) => s + d.value, 0);
  const avgDaily = totalRangeBookings === 0 ? 0 : Math.round(totalRangeBookings / 7);

  const stats = [
    { label: "Hotels", value: totalHotels, sub: "Active hotels", icon: Building2, tone: "bg-blue-500/10 text-blue-600", to: "/hotel-dashboard/hotels" },
    { label: "Rooms", value: rooms.length, sub: "Total rooms", icon: BedDouble, tone: "bg-purple-500/10 text-purple-600", to: "/hotel-dashboard/rooms" },
    { label: "Total Bookings", value: totalBookings, sub: "All time", icon: CalendarCheck, tone: "bg-emerald-500/10 text-emerald-600", to: "/hotel-dashboard/bookings" },
    { label: "Pending", value: pending, sub: "Awaiting approval", icon: Clock, tone: "bg-orange-500/10 text-orange-600", to: "/hotel-dashboard/bookings" },
    { label: "Confirmed", value: confirmedThisMonth, sub: "This month", icon: ShieldCheck, tone: "bg-cyan-500/10 text-cyan-600", trend: 14, to: "/hotel-dashboard/bookings" },
    { label: "Revenue This Month", value: `$${revenueThisMonth.toFixed(0)}`, sub: "vs last month", icon: Wallet, tone: "bg-teal-500/10 text-teal-600", trend: 12 },
  ];

  const quickActions = [
    { label: "Add Hotel", sub: "Register new hotel", icon: Plus, tone: "bg-blue-500 text-white", ring: "bg-blue-50", onClick: () => navigate("/hotel-dashboard/hotels?add=1") },
    { label: "Add Room", sub: "Add new room", icon: Bed, tone: "bg-purple-500 text-white", ring: "bg-purple-50", onClick: () => navigate("/hotel-dashboard/rooms?add=1") },
    { label: "View Bookings", sub: "Manage all bookings", icon: CalIcon, tone: "bg-emerald-500 text-white", ring: "bg-emerald-50", onClick: () => navigate("/hotel-dashboard/bookings") },
    { label: "Payments", sub: "View earnings", icon: CreditCard, tone: "bg-orange-500 text-white", ring: "bg-orange-50", onClick: () => navigate("/hotel-dashboard/account?tab=payments") },
  ];

  return (
    <HotelShellLayout showHeader={false}>
      {/* Native compact top bar */}
      <div className="pt-3 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/hotel-dashboard/account")}
            className="w-10 h-10 rounded-full bg-muted overflow-hidden ring-2 ring-primary/20 shrink-0"
            aria-label="Account"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm">
                {(profile?.full_name || "H")[0].toUpperCase()}
              </div>
            )}
          </button>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground leading-none">Good day 👋</p>
            <p className="text-[15px] font-bold truncate leading-tight mt-1">
              {profile?.full_name || profile?.company_name || "Hotel Owner"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/hotel-dashboard/notifications")}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-95 transition shrink-0"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Hotel verification gate */}
      {profile && profile.verification_status !== "approved" && (
        <div className={`mb-4 rounded-2xl p-4 border ${profile.verification_status === "pending" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <div className="flex items-start gap-3">
            <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${profile.verification_status === "pending" ? "text-amber-600" : "text-red-600"}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                {profile.verification_status === "pending" ? "Hotel verification pending review" : "Verify your hotel business"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.verification_status === "pending"
                  ? "Your submission is being reviewed. Hotels stay hidden from guests until approved."
                  : "Submit your business license, TIN and ownership proof to make your hotels visible to guests."}
              </p>
              {profile.verification_status !== "pending" && (
                <Button size="sm" className="mt-2 rounded-xl" onClick={() => navigate("/verification?type=hotel")}>
                  Get Verified Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero hotel card with cover photo backdrop */}
      {primaryHotel ? (
        <button
          onClick={() => navigate(`/hotels/${primaryHotel.id}`)}
          className="relative w-full h-40 rounded-3xl overflow-hidden mb-5 text-left shadow-md active:scale-[0.99] transition"
        >
          {primaryHotel.cover_photo ? (
            <img src={primaryHotel.cover_photo} alt={primaryHotel.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            {primaryHotel.is_verified && (
              <Badge className="bg-emerald-500 text-white border-0 text-[10px]">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />Verified
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-1 bg-black/40 backdrop-blur rounded-full px-2 py-0.5 text-white text-[11px]">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{Number(primaryHotel.rating || 0).toFixed(1)}</span>
              <span className="opacity-70">({primaryHotel.reviews_count || 0})</span>
            </div>
          </div>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-[17px] font-bold truncate">{primaryHotel.name}</h2>
            <div className="flex items-center gap-1 text-[11px] opacity-90 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{primaryHotel.city || primaryHotel.county}, Liberia</span>
            </div>
          </div>
        </button>
      ) : (
        <Card className="mb-5">
          <CardContent className="p-6 text-center space-y-3">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="font-semibold">No hotel yet</p>
            <p className="text-sm text-muted-foreground">Add your first hotel to start receiving bookings.</p>
            <Button onClick={() => navigate("/hotel-dashboard/hotels?add=1")}><Plus className="w-4 h-4 mr-2" />Add Hotel</Button>
          </CardContent>
        </Card>
      )}

      {/* Revenue highlight card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-4 mb-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] opacity-80">Revenue this month</p>
            <p className="text-[26px] font-bold leading-tight mt-1">${revenueThisMonth.toFixed(0)}</p>
            <div className="flex items-center gap-1 text-[11px] mt-1 bg-background/20 backdrop-blur rounded-full px-2 py-0.5 w-fit">
              <TrendingUp className="w-3 h-3" />
              <span>+12% vs last month</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-background/20 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">Overview</p>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {stats.slice(0, 4).map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => s.to && navigate(s.to)}
              className="text-left rounded-2xl bg-background border p-3 active:scale-[0.98] transition"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.tone}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[19px] font-bold mt-2 leading-none">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Actions — horizontal scroll like native */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">Quick actions</p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 mb-5 scrollbar-hide">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={a.onClick}
              className="shrink-0 w-24 rounded-2xl bg-background border p-3 text-center active:scale-95 transition"
            >
              <div className={`w-11 h-11 mx-auto rounded-2xl flex items-center justify-center ${a.tone} shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[12px] font-semibold mt-2 text-foreground leading-tight">{a.label}</p>
            </button>
          );
        })}
      </div>

      {/* Booking chart */}
      <div className="rounded-2xl bg-background border p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[13px] font-bold">Bookings</p>
            <p className="text-[10px] text-muted-foreground">Last 7 days</p>
          </div>
          <Select value={range} onValueChange={(v: any) => setRange(v)}>
            <SelectTrigger className="w-24 h-7 text-[11px] rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-baseline gap-3 mb-2">
          <p className="text-2xl font-bold">{totalRangeBookings}</p>
          <p className="text-[11px] text-muted-foreground">total · avg {avgDaily}/day</p>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} width={20} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={22}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reviews */}
      <div className="rounded-2xl bg-background border p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-bold">Guest reviews</p>
          <button className="text-[11px] text-primary font-semibold flex items-center">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-3 py-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-primary/50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold">No reviews yet</p>
            <p className="text-[11px] text-muted-foreground leading-snug">Guest reviews will appear here after their stay.</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[20px] font-bold leading-none">0.0</p>
            <div className="flex gap-0.5 mt-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 text-muted-foreground/30" />)}
            </div>
          </div>
        </div>
      </div>
    </HotelShellLayout>
  );
};

export default HotelDashboard;
