import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, User as UserIcon, Phone, Calendar, Users as UsersIcon, Check, X } from "lucide-react";

const HotelBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: h } = await supabase.from("hotels").select("id").eq("owner_id", user.id);
      const ids = (h || []).map((x: any) => x.id);
      if (!ids.length) { setBookings([]); return; }
      const { data } = await supabase.from("hotel_bookings").select("*").in("hotel_id", ids).order("created_at", { ascending: false });
      setBookings(data || []);
    })();
  }, [user, navigate]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("hotel_bookings").update({ status }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setBookings(bookings.map((b) => b.id === id ? { ...b, status } : b));
    toast({ title: `Booking ${status}` });
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const tabs = [
    { key: "all", label: "All", count: bookings.length },
    { key: "pending", label: "Pending", count: bookings.filter((b) => b.status === "pending").length },
    { key: "confirmed", label: "Confirmed", count: bookings.filter((b) => b.status === "confirmed").length },
    { key: "cancelled", label: "Cancelled", count: bookings.filter((b) => b.status === "cancelled").length },
  ];
  const totalRevenue = bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + Number(b.total || 0), 0);

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700 border-amber-500/20",
    confirmed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
    cancelled: "bg-rose-500/15 text-rose-700 border-rose-500/20",
  };

  return (
    <HotelShellLayout title="Bookings" subtitle="Guest reservations">
      <div className="space-y-4">
        {/* Revenue hero */}
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-5 shadow-lg shadow-primary/20">
          <p className="text-xs uppercase tracking-wider opacity-80">Confirmed revenue</p>
          <p className="text-3xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs opacity-80 mt-1">{bookings.length} total bookings</p>
        </div>

        {/* Segmented pills */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold border transition-colors ${
                filter === t.key ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border"
              }`}
            >
              {t.label} <span className="opacity-70">· {t.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <CalendarCheck className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No bookings</p>
            <p className="text-sm text-muted-foreground mt-1">New guest reservations will appear here.</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-3xl bg-background border p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {(b.guest_name || "G").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[15px] truncate">{b.guest_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[b.status] || "bg-muted text-muted-foreground"}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{b.guest_phone || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-2xl bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" />Check-in</p>
                  <p className="text-[13px] font-semibold mt-0.5">{b.check_in}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" />Check-out</p>
                  <p className="text-[13px] font-semibold mt-0.5">{b.check_out}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><UsersIcon className="w-3 h-3" />{b.guests} guests</p>
                <p className="text-base font-bold text-primary">${Number(b.total).toFixed(2)}</p>
              </div>

              {b.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="flex-1 h-10 rounded-full border border-border text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4" />Decline
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="flex-1 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1 shadow-lg shadow-primary/20"
                  >
                    <Check className="w-4 h-4" />Confirm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </HotelShellLayout>
  );
};

export default HotelBookingsPage;