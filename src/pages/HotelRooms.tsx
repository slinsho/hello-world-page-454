import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Users, Maximize2, Flame, Minus, Plus, Calendar as CalIcon, BedDouble, Wifi, Waves, Coffee, Car, Snowflake, Dumbbell, Utensils, Tv, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookingStepper } from "@/components/booking/BookingStepper";

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

  const fmtDate = (d: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Native-style header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 px-3 pt-3 pb-1">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 grid place-items-center rounded-full hover:bg-muted active:scale-95 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1" />
          </div>
          <div className="px-4 pb-1">
            <h1 className="text-lg font-bold tracking-tight">Book your stay</h1>
            {hotel && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="truncate">{hotel.name}</span>
                {hotel.is_verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-semibold">
                    <ShieldCheck className="w-3 h-3" />Verified
                  </span>
                )}
              </p>
            )}
          </div>
          <BookingStepper step={1} />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-3 space-y-4">
        {/* Dates + guests native sheet */}
        <section className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border">
            <label className="p-3 active:bg-muted/50 transition-colors cursor-pointer relative">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <CalIcon className="w-3 h-3" />Check-in
              </div>
              <div className="font-bold text-sm mt-0.5 tabular-nums">{fmtDate(checkIn)}</div>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <label className="p-3 active:bg-muted/50 transition-colors cursor-pointer relative">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <CalIcon className="w-3 h-3" />Check-out
              </div>
              <div className="font-bold text-sm mt-0.5 tabular-nums">{fmtDate(checkOut)}</div>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>
          <div className="border-t border-border p-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <Users className="w-3 h-3" />Guests
              </div>
              <div className="font-bold text-sm mt-0.5">{guests} {guests === 1 ? "guest" : "guests"}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="w-8 h-8 rounded-full border border-border grid place-items-center active:scale-90 disabled:opacity-40 transition"
                disabled={guests <= 1}
                aria-label="Decrease guests"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-bold text-sm tabular-nums">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests((g) => g + 1)}
                className="w-8 h-8 rounded-full border border-border grid place-items-center active:scale-90 transition"
                aria-label="Increase guests"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Section title */}
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-sm font-bold tracking-tight">Choose your room</h2>
          <span className="text-[11px] text-muted-foreground tabular-nums">{rooms.length} available</span>
        </div>

        {/* Room list — compact horizontal cards */}
        <div className="space-y-2.5">
          {rooms.map((r) => {
            const isSelected = selectedRoom === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoom(r.id)}
                className={`w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.99] flex gap-3 p-2.5 ${
                  isSelected
                    ? "bg-card ring-2 ring-primary shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.35)]"
                    : "bg-card border border-border"
                }`}
              >
                <div className="relative w-24 h-24 rounded-xl bg-muted overflow-hidden shrink-0">
                  {r.photos?.[0] && <img src={r.photos[0]} alt={r.name} className="w-full h-full object-cover" />}
                  {r.is_most_popular && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                      <Flame className="w-2.5 h-2.5" />Popular
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-tight truncate">{r.name}</h3>
                    <div className={`w-5 h-5 rounded-full grid place-items-center shrink-0 transition ${
                      isSelected ? "bg-primary" : "border-2 border-muted-foreground/40"
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{r.guests}</span>
                    {r.size_sqm && <span className="flex items-center gap-0.5"><Maximize2 className="w-2.5 h-2.5" />{r.size_sqm}m²</span>}
                    {r.bed_type && <span className="flex items-center gap-0.5 truncate"><BedDouble className="w-2.5 h-2.5" />{r.bed_type}</span>}
                  </div>
                  <div className="mt-1.5">
                    <span className="text-primary font-bold text-sm tabular-nums">${r.price_per_night}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">/ night</span>
                  </div>
                </div>
              </button>
            );
          })}
          {rooms.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No rooms available yet.
            </div>
          )}
        </div>
      </main>

      {/* Sticky native-style bottom action */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-3">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {nights} Night{nights > 1 ? "s" : ""} · {guests} {guests === 1 ? "guest" : "guests"}
            </p>
            <p className="font-bold text-base tabular-nums leading-tight">
              <span className="text-primary">${subtotal.toFixed(2)}</span>
            </p>
          </div>
          <Button
            onClick={proceed}
            className="h-12 px-6 rounded-2xl font-semibold text-sm active:scale-[0.98] shadow-lg"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotelRooms;
