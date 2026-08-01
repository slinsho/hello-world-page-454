import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, TrendingUp, BedDouble, DollarSign, CalendarX2, Star } from "lucide-react";

const RANGES = [
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "365", label: "12 months" },
] as const;

const money = (n: number) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const nightsBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

const HotelAnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<"30" | "90" | "365">("30");
  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      setLoading(true);
      const { data: h } = await supabase.from("hotels").select("*").eq("owner_id", user.id);
      const ids = (h || []).map((x: any) => x.id);
      setHotels(h || []);
      if (!ids.length) { setRooms([]); setBookings([]); setReviews([]); setBlocked([]); setLoading(false); return; }
      const [{ data: r }, { data: b }, { data: rv }] = await Promise.all([
        supabase.from("hotel_rooms").select("*").in("hotel_id", ids),
        supabase.from("hotel_bookings").select("*").in("hotel_id", ids),
        (supabase.from("hotel_reviews" as any) as any).select("rating,hotel_id").in("hotel_id", ids),
      ]);
      setRooms(r || []); setBookings(b || []); setReviews(rv || []);
      const roomIds = (r || []).map((x: any) => x.id);
      if (roomIds.length) {
        const { data: ra } = await (supabase.from("room_availability" as any) as any)
          .select("room_id,date,is_blocked").in("room_id", roomIds).eq("is_blocked", true);
        setBlocked(ra || []);
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const stats = useMemo(() => {
    const days = Number(range);
    const since = new Date(Date.now() - days * 86400000);
    const inRange = bookings.filter((b) => new Date(b.created_at) >= since && !["cancelled", "rejected"].includes(b.status));
    const revenue = inRange.reduce((s, b) => s + Number(b.total || 0), 0);
    const roomNights = inRange.reduce((s, b) => s + nightsBetween(b.check_in, b.check_out) * Number(b.rooms || 1), 0);
    const capacity = Math.max(1, rooms.length * days);
    const occupancy = Math.min(100, (roomNights / capacity) * 100);
    const adr = roomNights ? revenue / roomNights : 0;
    const cancelled = bookings.filter((b) => new Date(b.created_at) >= since && b.status === "cancelled").length;
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0;

    const perRoom = rooms.map((rm) => {
      const rb = inRange.filter((b) => b.room_id === rm.id);
      const rn = rb.reduce((s, b) => s + nightsBetween(b.check_in, b.check_out) * Number(b.rooms || 1), 0);
      return {
        id: rm.id,
        name: rm.name,
        revenue: rb.reduce((s, b) => s + Number(b.total || 0), 0),
        nights: rn,
        occupancy: Math.min(100, (rn / days) * 100),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Monthly revenue trend (last 6 buckets)
    const buckets: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString(undefined, { month: "short" });
      const value = bookings
        .filter((b) => !["cancelled", "rejected"].includes(b.status))
        .filter((b) => {
          const c = new Date(b.created_at);
          return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
        })
        .reduce((s, b) => s + Number(b.total || 0), 0);
      buckets.push({ label, value });
    }

    // Upcoming availability gaps (next 14 nights with no booking and not blocked)
    const gaps: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
      const booked = bookings.some((b) => !["cancelled", "rejected"].includes(b.status) && b.check_in <= d && b.check_out > d);
      const isBlocked = blocked.some((x) => x.date === d);
      if (!booked && !isBlocked) gaps.push(d);
    }

    return { revenue, occupancy, adr, cancelled, avgRating, perRoom, buckets, gaps, count: inRange.length };
  }, [bookings, rooms, reviews, blocked, range]);

  const maxBucket = Math.max(1, ...stats.buckets.map((b) => b.value));

  return (
    <HotelShellLayout title="Analytics" subtitle="Performance">
      <div className="space-y-4">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`flex-1 h-9 rounded-full text-[13px] font-semibold border ${range === r.key ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white p-4">
            <DollarSign className="w-5 h-5 opacity-90" />
            <p className="text-2xl font-bold mt-2">{money(stats.revenue)}</p>
            <p className="text-[11px] opacity-90">Revenue · {stats.count} bookings</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-400 text-white p-4">
            <TrendingUp className="w-5 h-5 opacity-90" />
            <p className="text-2xl font-bold mt-2">{stats.occupancy.toFixed(0)}%</p>
            <p className="text-[11px] opacity-90">Occupancy rate</p>
          </div>
          <div className="rounded-3xl bg-background border p-4">
            <BedDouble className="w-5 h-5 text-muted-foreground" />
            <p className="text-2xl font-bold mt-2">{money(stats.adr)}</p>
            <p className="text-[11px] text-muted-foreground">Avg. nightly rate</p>
          </div>
          <div className="rounded-3xl bg-background border p-4">
            <Star className="w-5 h-5 text-amber-500" />
            <p className="text-2xl font-bold mt-2">{stats.avgRating.toFixed(1)}</p>
            <p className="text-[11px] text-muted-foreground">Guest rating · {reviews.length} reviews</p>
          </div>
        </div>

        <div className="rounded-3xl bg-background border p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <p className="font-semibold text-sm">Revenue trend (6 months)</p>
          </div>
          <div className="flex items-end gap-2 h-32">
            {stats.buckets.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-primary/80" style={{ height: `${(b.value / maxBucket) * 100}%`, minHeight: 4 }} />
                <span className="text-[10px] text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-background border p-4">
          <p className="font-semibold text-sm mb-3">Revenue per room</p>
          {stats.perRoom.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rooms yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.perRoom.map((r) => (
                <div key={r.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="tabular-nums font-semibold">{money(r.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(2, r.occupancy)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.nights} room-nights · {r.occupancy.toFixed(0)}% occupancy</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-background border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarX2 className="w-4 h-4 text-muted-foreground" />
            <p className="font-semibold text-sm">Upcoming availability gaps</p>
          </div>
          {stats.gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Fully booked for the next 14 nights 🎉</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {stats.gaps.map((d) => (
                <span key={d} className="text-[11px] px-2 py-1 rounded-full bg-muted font-medium">
                  {new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">{stats.cancelled} cancellations in this period.</p>
        </div>

        {!loading && hotels.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Add a hotel to start seeing analytics.</p>
        )}
      </div>
    </HotelShellLayout>
  );
};

export default HotelAnalyticsPage;
