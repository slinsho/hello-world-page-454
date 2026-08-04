import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { ArrowLeft, ShieldCheck, Users, Maximize2, Flame, Minus, Plus, Calendar as CalIcon, BedDouble, Wifi, Waves, Coffee, Car, Snowflake, Dumbbell, Utensils, Tv, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookingStepper } from "@/components/booking/BookingStepper";

const isoLocal = (d: Date) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const HotelRooms = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfToday(),
    to: new Date(startOfToday().getTime() + 86400000),
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [pricingRule, setPricingRule] = useState<any>(null);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data: h } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
      const { data: r } = await supabase.from("hotel_rooms").select("*").eq("hotel_id", id).eq("is_active", true).order("price_per_night");
      setHotel(h);
      setRooms(r || []);
      if (r?.length) setSelectedRoom(r[0].id);
      const { data: rule } = await (supabase.from("hotel_pricing_rules" as any) as any)
        .select("*").eq("hotel_id", id).maybeSingle();
      setPricingRule(rule);
    })();
  }, [id]);

  // Load blocked dates + existing bookings + price overrides for the selected room
  useEffect(() => {
    if (!selectedRoom) return;
    (async () => {
      const from = isoLocal(startOfToday());
      const to = isoLocal(new Date(startOfToday().getTime() + 365 * 86400000));
      const [{ data: av }, { data: bk }] = await Promise.all([
        (supabase.from("room_availability" as any) as any).select("date,is_blocked,price_override").eq("room_id", selectedRoom).gte("date", from).lte("date", to),
        supabase.from("hotel_bookings").select("check_in,check_out,status").eq("room_id", selectedRoom).gte("check_out", from),
      ]);
      const blocked = new Set<string>();
      const prices: Record<string, number> = {};
      (av || []).forEach((a: any) => {
        if (a.is_blocked) blocked.add(a.date);
        if (a.price_override != null) prices[a.date] = Number(a.price_override);
      });
      (bk || []).forEach((b: any) => {
        if (["cancelled", "rejected"].includes(b.status)) return;
        const start = new Date(`${b.check_in}T00:00:00`);
        const end = new Date(`${b.check_out}T00:00:00`);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) blocked.add(isoLocal(d));
      });
      setUnavailable(blocked);
      setPriceMap(prices);
    })();
  }, [selectedRoom]);

  const checkIn = range?.from ? isoLocal(range.from) : "";
  const checkOut = range?.to ? isoLocal(range.to) : "";
  const nights = range?.from && range?.to
    ? Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000))
    : 1;
  const room = rooms.find((r) => r.id === selectedRoom);

  // Nightly pricing honoring overrides + weekend surcharge, then LOS / early-bird / last-minute
  const pricing = useMemo(() => {
    if (!room || !range?.from || !range?.to) return { subtotal: 0, discount: 0, total: 0, labels: [] as string[] };
    const base = Number(room.price_per_night) || 0;
    const weekendDays: number[] = pricingRule?.weekend_days || [];
    const weekendPct = Number(pricingRule?.weekend_surcharge_pct || 0);
    let subtotal = 0;
    for (let i = 0; i < nights; i++) {
      const d = new Date(range.from);
      d.setDate(d.getDate() + i);
      const key = isoLocal(d);
      let p = priceMap[key] != null ? priceMap[key] : base;
      if (priceMap[key] == null && weekendPct > 0 && weekendDays.includes(d.getDay())) {
        p = p * (1 + weekendPct / 100);
      }
      subtotal += p;
    }
    const labels: string[] = [];
    let discount = 0;
    const losMin = Number(pricingRule?.los_min_nights || 0);
    const losPct = Number(pricingRule?.los_discount_pct || 0);
    if (losMin > 0 && losPct > 0 && nights >= losMin) { discount += subtotal * (losPct / 100); labels.push(`${losPct}% long-stay discount`); }
    const daysAhead = Math.round((range.from.getTime() - startOfToday().getTime()) / 86400000);
    const ebPct = Number(pricingRule?.early_bird_pct || 0);
    const ebDays = Number(pricingRule?.early_bird_days || 0);
    if (ebPct > 0 && ebDays > 0 && daysAhead >= ebDays) { discount += subtotal * (ebPct / 100); labels.push(`${ebPct}% early-bird discount`); }
    const lmPct = Number(pricingRule?.last_minute_pct || 0);
    const lmDays = Number(pricingRule?.last_minute_days || 0);
    if (lmPct > 0 && lmDays > 0 && daysAhead <= lmDays) { discount += subtotal * (lmPct / 100); labels.push(`${lmPct}% last-minute deal`); }
    return { subtotal: +subtotal.toFixed(2), discount: +discount.toFixed(2), total: +(subtotal - discount).toFixed(2), labels };
  }, [room, range, nights, pricingRule, priceMap]);

  const rangeHasBlocked = useMemo(() => {
    if (!range?.from || !range?.to) return false;
    for (let i = 0; i < nights; i++) {
      const d = new Date(range.from);
      d.setDate(d.getDate() + i);
      if (unavailable.has(isoLocal(d))) return true;
    }
    return false;
  }, [range, nights, unavailable]);

  const proceed = () => {
    if (!selectedRoom) { toast({ title: "Select a room", variant: "destructive" }); return; }
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      toast({ title: "Pick your dates", description: "Choose a check-in and check-out date.", variant: "destructive" });
      setPickerOpen(true);
      return;
    }
    if (rangeHasBlocked) {
      toast({ title: "Dates unavailable", description: "Some nights in your selection are already booked or blocked.", variant: "destructive" });
      return;
    }
    navigate(`/hotels/${id}/book?room=${selectedRoom}&in=${checkIn}&out=${checkOut}&guests=${guests}`);
  };

  const fmtDate = (d?: Date) =>
    d ? d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Select";

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
        {/* Dates + guests */}
        <section className="rounded-2xl bg-card border border-border overflow-hidden">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="w-full grid grid-cols-2 divide-x divide-border text-left active:bg-muted/50 transition-colors">
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <CalIcon className="w-3 h-3" />Check-in
                  </div>
                  <div className="font-bold text-sm mt-0.5 tabular-nums">{fmtDate(range?.from)}</div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <CalIcon className="w-3 h-3" />Check-out
                  </div>
                  <div className="font-bold text-sm mt-0.5 tabular-nums">{fmtDate(range?.to)}</div>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="range"
                numberOfMonths={1}
                selected={range}
                onSelect={(r) => {
                  setRange(r);
                  if (r?.from && r?.to) setPickerOpen(false);
                }}
                disabled={[{ before: startOfToday() }, (d: Date) => unavailable.has(isoLocal(d))]}
                initialFocus
                className="p-3 pointer-events-auto"
              />
              <div className="border-t p-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground px-1">Unavailable nights are disabled</p>
                <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => setRange(undefined)}>Clear</Button>
              </div>
            </PopoverContent>
          </Popover>

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

        {rangeHasBlocked && (
          <p className="text-[11px] font-medium text-destructive px-1">
            Some nights in your selection are unavailable. Please pick different dates.
          </p>
        )}
        {pricing.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {pricing.labels.map((l) => (
              <span key={l} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{l}</span>
            ))}
          </div>
        )}

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
                  {(() => {
                    const AM_ICONS: Record<string, any> = { wifi: Wifi, pool: Waves, breakfast: Coffee, parking: Car, ac: Snowflake, gym: Dumbbell, restaurant: Utensils, tv: Tv };
                    const AM_LABELS: Record<string, string> = { wifi: "WiFi", pool: "Pool", breakfast: "Breakfast", parking: "Parking", ac: "AC", gym: "Gym", restaurant: "Restaurant", tv: "TV" };
                    const am = (r.amenities || {}) as Record<string, any>;
                    const active = Object.keys(am).filter((k) => am[k]);
                    if (!active.length) return null;
                    return (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {active.slice(0, 5).map((k) => {
                          const Ic = AM_ICONS[k] || Sparkles;
                          return (
                            <span key={k} className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              <Ic className="w-2.5 h-2.5" />{AM_LABELS[k] || k}
                            </span>
                          );
                        })}
                        {active.length > 5 && <span className="text-[9px] text-muted-foreground px-1">+{active.length - 5}</span>}
                      </div>
                    );
                  })()}
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
            <p className="font-bold text-base tabular-nums leading-tight flex items-baseline gap-1.5">
              {pricing.discount > 0 && (
                <span className="text-[11px] text-muted-foreground line-through">${pricing.subtotal.toFixed(2)}</span>
              )}
              <span className="text-primary">${pricing.total.toFixed(2)}</span>
            </p>
          </div>
          <Button
            onClick={proceed}
            disabled={rangeHasBlocked}
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
