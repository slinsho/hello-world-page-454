import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShieldCheck, User, Maximize2, Wifi, Snowflake, Tv, Coffee, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HotelRooms = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    (async () => {
      const { data: h } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
      const { data: r } = await supabase.from("hotel_rooms").select("*").eq("hotel_id", id).eq("is_active", true).order("price_per_night");
      setHotel(h);
      setRooms(r || []);
      if (r?.length) setSelectedRoom(r[0].id);
    })();
  }, [id]);

  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const room = rooms.find((r) => r.id === selectedRoom);
  const subtotal = room ? Number(room.price_per_night) * nights : 0;

  const proceed = () => {
    if (!selectedRoom) { toast({ title: "Select a room", variant: "destructive" }); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { toast({ title: "Invalid dates", variant: "destructive" }); return; }
    navigate(`/hotels/${id}/book?room=${selectedRoom}&in=${checkIn}&out=${checkOut}&guests=${guests}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1 text-center">
            <h1 className="font-bold">Choose Your Room</h1>
            {hotel && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                {hotel.name}
                {hotel.is_verified && <Badge className="bg-green-600 text-white gap-1 h-4 text-[10px]"><ShieldCheck className="w-2.5 h-2.5" />Verified</Badge>}
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="border border-border rounded-xl p-3">
            <Label className="text-xs text-muted-foreground">Check-in</Label>
            <Input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} className="border-0 p-0 h-auto font-semibold" />
          </div>
          <div className="border border-border rounded-xl p-3">
            <Label className="text-xs text-muted-foreground">Check-out</Label>
            <Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="border-0 p-0 h-auto font-semibold" />
          </div>
          <div className="border border-border rounded-xl p-3">
            <Label className="text-xs text-muted-foreground">Guests</Label>
            <Input type="number" min={1} value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)} className="border-0 p-0 h-auto font-semibold" />
          </div>
        </div>

        <div className="space-y-3">
          {rooms.map((r) => {
            const isSelected = selectedRoom === r.id;
            return (
              <button key={r.id} onClick={() => setSelectedRoom(r.id)} className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex">
                  <div className="w-32 md:w-40 aspect-square bg-muted relative shrink-0">
                    {r.photos?.[0] && <img src={r.photos[0]} alt={r.name} className="w-full h-full object-cover" />}
                    {r.is_most_popular && (
                      <Badge className="absolute top-2 left-2 bg-primary text-white gap-1 text-[10px]"><Flame className="w-3 h-3" />Most Popular</Badge>
                    )}
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold">{r.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.guests} Guests</span>
                          {r.size_sqm && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{r.size_sqm} m²</span>}
                        </div>
                        {r.bed_type && <p className="text-sm mt-1">{r.bed_type}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold">${r.price_per_night}</p>
                        <p className="text-[10px] text-muted-foreground">/ night</p>
                        <div className={`mt-2 w-5 h-5 rounded-full border-2 mx-auto ${isSelected ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full m-auto mt-[3px]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {rooms.length === 0 && <p className="text-center py-10 text-muted-foreground">No rooms available yet.</p>}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-3 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{nights} Night{nights > 1 ? "s" : ""}</p>
            <p className="font-bold text-primary">${subtotal.toFixed(2)}</p>
          </div>
          <Button onClick={proceed} className="h-12 px-6">Continue to Book</Button>
        </div>
      </div>
    </div>
  );
};

export default HotelRooms;
