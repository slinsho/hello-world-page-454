import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminHotelBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("hotel_bookings").select("*, hotels(name), hotel_rooms(name)").order("created_at", { ascending: false });
      setBookings((data as any[]) || []);
      setLoading(false);
    })();
  }, []);
  if (loading) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold">Hotel Bookings ({bookings.length})</h2>
      {bookings.map((b) => (
        <Card key={b.id}>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{b.hotels?.name} — {b.hotel_rooms?.name}</p>
              <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}>{b.status}</Badge>
            </div>
            <p className="text-sm">{b.guest_name} · {b.guest_phone}</p>
            <p className="text-xs text-muted-foreground">{b.check_in} → {b.check_out} · {b.guests} guests · {b.payment_method}</p>
            <p className="text-sm font-bold text-primary">${Number(b.total).toFixed(2)}</p>
            {b.payment_reference && <p className="text-xs">Ref: {b.payment_reference}</p>}
          </CardContent>
        </Card>
      ))}
      {bookings.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
    </div>
  );
};

export default AdminHotelBookings;
