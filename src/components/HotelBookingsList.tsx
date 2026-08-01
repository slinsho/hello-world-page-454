import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const statusStyle = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600",
    confirmed: "bg-green-500/15 text-green-600",
    checked_in: "bg-blue-500/15 text-blue-600",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return map[s] || "bg-muted text-muted-foreground";
};

export const HotelBookingsList = ({ userId }: { userId: string }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hotel_bookings")
        .select("*, hotels(name,city,county,cover_photo), hotel_rooms(name)")
        .eq("guest_id", userId)
        .order("created_at", { ascending: false });
      setBookings(data || []);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>;

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Hotel className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-3">No hotel bookings yet</p>
        <Button onClick={() => navigate("/hotels")} variant="outline" size="sm" className="rounded-full">Browse hotels</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {bookings.map((b) => (
        <div key={b.id} className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border">
          <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
            {b.hotels?.cover_photo && <img src={b.hotels.cover_photo} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm leading-tight truncate">{b.hotels?.name || "Hotel"}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusStyle(b.status)}`}>{b.status}</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{b.hotel_rooms?.name}</p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {new Date(b.check_in).toLocaleDateString(undefined, { month: "short", day: "numeric" })} →{" "}
              {new Date(b.check_out).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-primary font-bold text-sm tabular-nums">${Number(b.total || 0).toFixed(2)}</p>
              {(b.checked_out_at || b.status === "completed") && (
                <button
                  onClick={() => navigate(`/hotels/${b.hotel_id}`)}
                  className="text-[11px] font-semibold text-primary underline underline-offset-2"
                >
                  Leave a review
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
