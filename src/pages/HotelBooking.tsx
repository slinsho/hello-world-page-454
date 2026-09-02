import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, ShieldCheck, Lock, CalendarDays, MapPin, User, Building2, Phone, Mail, Clock,
  ChevronDown, ChevronUp, IdCard, Wallet, Smartphone, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookingStepper } from "@/components/booking/BookingStepper";

const METHODS = [
  { value: "pay_at_hotel", label: "Pay at Hotel", desc: "Pay when you check-in", icon: Wallet, disabled: false },
  { value: "mobile_money", label: "Mobile Money", desc: "MTN MoMo, Orange — coming soon", icon: Smartphone, disabled: true },
];

const ID_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voter_id", label: "Voter ID" },
  { value: "other", label: "Other" },
];

const HotelBooking = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const roomId = params.get("room");
  const checkIn = params.get("in") || "";
  const checkOut = params.get("out") || "";
  const guestsN = parseInt(params.get("guests") || "1");

  const [hotel, setHotel] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [pricingRule, setPricingRule] = useState<any>(null);
  const [method, setMethod] = useState("pay_at_hotel");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestDetails, setGuestDetails] = useState<{ name: string; age: string; id_type: string; id_number: string }[]>(
    Array.from({ length: guestsN }, () => ({ name: "", age: "", id_type: "national_id", id_number: "" }))
  );
  const [expandedGuest, setExpandedGuest] = useState<number>(0);
  const [step, setStep] = useState<"form" | "review">("form");
  const [units, setUnits] = useState<any[]>([]);
  const [occupied, setOccupied] = useState<string[]>([]);
  const [unitId, setUnitId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: h } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
      const { data: r } = await supabase.from("hotel_rooms").select("*").eq("id", roomId).maybeSingle();
      setHotel(h); setRoom(r);
      if (h?.id) {
        const { data: rule } = await (supabase.from("hotel_pricing_rules" as any) as any).select("*").eq("hotel_id", h.id).maybeSingle();
        setPricingRule(rule);
      }
      if (roomId && checkIn && checkOut) {
        const { data: av } = await (supabase.from("room_availability" as any) as any)
          .select("*").eq("room_id", roomId).gte("date", checkIn).lt("date", checkOut);
        setAvailability(av || []);
        const [{ data: us }, { data: occ }] = await Promise.all([
          (supabase.from("hotel_room_units" as any) as any)
            .select("*").eq("room_id", roomId).eq("is_active", true).order("room_number"),
          (supabase.rpc as any)("get_occupied_room_units", { _room_id: roomId, _in: checkIn, _out: checkOut }),
        ]);
        setUnits(us || []);
        setOccupied(((occ || []) as any[]).map((x: any) => (typeof x === "string" ? x : x.get_occupied_room_units)));
      }
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("name, phone, email").eq("id", user.id).maybeSingle();
        if (prof) { setGuestName(prof.name || ""); setGuestPhone(prof.phone || ""); setGuestEmail(prof.email || ""); }
      }
    })();
  }, [id, roomId, user, checkIn, checkOut]);

  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;

  // Compute nightly breakdown honoring room_availability overrides + weekend surcharge
  const nightBreakdown = (() => {
    if (!room || !checkIn || !checkOut) return [] as { date: string; price: number; blocked: boolean }[];
    const base = Number(room.price_per_night) || 0;
    const weekendDays: number[] = pricingRule?.weekend_days || [0, 6];
    const weekendPct = Number(pricingRule?.weekend_surcharge_pct || 0);
    const availMap: Record<string, any> = {};
    availability.forEach((a: any) => { availMap[a.date] = a; });
    const out: { date: string; price: number; blocked: boolean }[] = [];
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const entry = availMap[iso];
      const blocked = !!entry?.is_blocked;
      let price = entry?.price_override != null ? Number(entry.price_override) : base;
      if (entry?.price_override == null && weekendPct > 0 && weekendDays.includes(d.getDay())) {
        price = +(price * (1 + weekendPct / 100)).toFixed(2);
      }
      out.push({ date: iso, price, blocked });
    }
    return out;
  })();
  const anyBlocked = nightBreakdown.some((n) => n.blocked);
  const subtotal = nightBreakdown.reduce((s, n) => s + n.price, 0);
  // Length-of-stay discount
  const losMin = Number(pricingRule?.los_min_nights || 0);
  const losPct = Number(pricingRule?.los_discount_pct || 0);
  const losDiscount = losMin > 0 && losPct > 0 && nights >= losMin ? +(subtotal * (losPct / 100)).toFixed(2) : 0;
  // Early-bird / last-minute deals
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const daysAhead = checkIn ? Math.round((new Date(`${checkIn}T00:00:00`).getTime() - today0.getTime()) / 86400000) : 0;
  const ebPct = Number(pricingRule?.early_bird_pct || 0);
  const ebDays = Number(pricingRule?.early_bird_days || 0);
  const earlyBirdDiscount = ebPct > 0 && ebDays > 0 && daysAhead >= ebDays ? +(subtotal * (ebPct / 100)).toFixed(2) : 0;
  const lmPct = Number(pricingRule?.last_minute_pct || 0);
  const lmDays = Number(pricingRule?.last_minute_days || 0);
  const lastMinuteDiscount = lmPct > 0 && lmDays > 0 && daysAhead <= lmDays ? +(subtotal * (lmPct / 100)).toFixed(2) : 0;
  const totalDiscount = +(losDiscount + earlyBirdDiscount + lastMinuteDiscount).toFixed(2);
  const discountedSubtotal = subtotal - totalDiscount;
  const taxes = +(discountedSubtotal * 0.1).toFixed(2);
  const serviceFee = +(discountedSubtotal * 0.05).toFixed(2);
  const total = discountedSubtotal + taxes + serviceFee;

  const updateGuest = (i: number, field: "name" | "age" | "id_type" | "id_number", value: string) => {
    setGuestDetails((g) => g.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));
  };

  const guestComplete = (g: { name: string; age: string; id_number: string }) =>
    !!(g.name && g.age && g.id_number);

  const goReview = () => {
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to book.", variant: "destructive" }); navigate("/auth"); return; }
    if (anyBlocked) { toast({ title: "Dates unavailable", description: "One or more nights in this range are blocked. Please choose different dates.", variant: "destructive" }); return; }
    if (!guestName || !guestPhone) { toast({ title: "Name and phone required", variant: "destructive" }); return; }
    if (units.length > 0 && !unitId) { toast({ title: "Select a room number", description: "Pick an available room number to continue.", variant: "destructive" }); return; }
    for (let i = 0; i < guestDetails.length; i++) {
      if (!guestDetails[i].name || !guestDetails[i].age) {
        toast({ title: `Guest ${i + 1} details required`, description: "Enter name and age for every guest.", variant: "destructive" });
        setExpandedGuest(i);
        return;
      }
      if (!guestDetails[i].id_number) {
        toast({ title: `Guest ${i + 1} ID required`, description: "Enter an ID number for every guest.", variant: "destructive" });
        setExpandedGuest(i);
        return;
      }
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmBooking = async () => {
    if (!user) return;
    // Enforce room capacity — cannot book more guests than the room supports.
    if (room?.guests && guestsN > Number(room.guests)) {
      toast({
        title: "Too many guests",
        description: `This room fits up to ${room.guests} guests. Please adjust your search.`,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    // Generate the guest's check-in code up-front so their QR ticket is ready
    // as soon as the booking is created.
    const checkInCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("hotel_bookings").insert({
      hotel_id: id, room_id: roomId, room_unit_id: unitId, guest_id: user.id,
      guest_name: guestName, guest_phone: guestPhone, guest_email: guestEmail || null,
      check_in: checkIn, check_out: checkOut, guests: guestsN, rooms: 1,
      subtotal, taxes, service_fee: serviceFee, total,
      payment_method: method, payment_reference: paymentRef || null,
      guest_details: guestDetails as any,
      check_in_code: checkInCode,
    } as any).select().single();
    setLoading(false);
    if (error) { toast({ title: "Booking failed", description: error.message, variant: "destructive" }); return; }

    // Owner + guest notifications are now created automatically by a DB trigger
    // (notify_on_hotel_booking) that bypasses RLS. No manual insert needed here.

    toast({ title: "Booking submitted!", description: "The hotel will confirm your booking shortly." });
    // Send the user back to THEIR account page — customers use /my-account,
    // property owners / agents / hotels use /profile.
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    navigate(prof?.role === "customer" || !prof?.role ? "/my-account" : "/profile");
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "";

  // ===== REVIEW STEP =====
  if (step === "review") {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/60">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 px-3 pt-3 pb-1">
              <button
                onClick={() => setStep("form")}
                className="w-10 h-10 grid place-items-center rounded-full hover:bg-muted active:scale-95 transition-transform"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pb-1">
              <h1 className="text-lg font-bold tracking-tight">Review booking</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Confirm the details before submitting</p>
            </div>
            <BookingStepper step={3} />
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
          {hotel && room && (
            <section className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="flex gap-3 p-4">
                <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden shrink-0">
                  {hotel.cover_photo && <img src={hotel.cover_photo} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{hotel.name}</span>
                    {hotel.is_verified && <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />{hotel.address}
                  </p>
                  <Badge variant="secondary" className="text-[10px] mt-1.5">{room.name}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 border-t border-border divide-x divide-border text-center">
                <div className="p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">In</p>
                  <p className="text-xs font-bold mt-0.5">{fmt(checkIn)}</p>
                </div>
                <div className="p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Out</p>
                  <p className="text-xs font-bold mt-0.5">{fmt(checkOut)}</p>
                </div>
                <div className="p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Nights</p>
                  <p className="text-xs font-bold mt-0.5 tabular-nums">{nights}</p>
                </div>
                <div className="p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Guests</p>
                  <p className="text-xs font-bold mt-0.5 tabular-nums">{guestsN}</p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-card border border-border p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Primary contact</h3>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{guestName}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{guestPhone}</p>
              {guestEmail && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{guestEmail}</p>}
            </div>
          </section>

          <section className="rounded-2xl bg-card border border-border p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Guests · {guestDetails.length}
            </h3>
            <div className="divide-y divide-border">
              {guestDetails.map((g, i) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{i + 1}. {g.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{g.age} yrs</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <IdCard className="w-3 h-3" />
                    {ID_TYPES.find((t) => t.value === g.id_type)?.label}: {g.id_number}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-card border border-border p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Payment</h3>
            <p className="text-sm font-semibold mb-3">{METHODS.find((m) => m.value === method)?.label}</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">${room?.price_per_night || 0} × {nights} nights</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
              {losDiscount > 0 && (<div className="flex justify-between text-primary"><span>Long-stay discount ({losPct}%)</span><span className="tabular-nums">-${losDiscount.toFixed(2)}</span></div>)}
              {earlyBirdDiscount > 0 && (<div className="flex justify-between text-primary"><span>Early-bird discount ({ebPct}%)</span><span className="tabular-nums">-${earlyBirdDiscount.toFixed(2)}</span></div>)}
              {lastMinuteDiscount > 0 && (<div className="flex justify-between text-primary"><span>Last-minute deal ({lmPct}%)</span><span className="tabular-nums">-${lastMinuteDiscount.toFixed(2)}</span></div>)}
              <div className="flex justify-between"><span className="text-muted-foreground">Taxes & fees</span><span className="tabular-nums">${taxes.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span className="tabular-nums">${serviceFee.toFixed(2)}</span></div>
            </div>
            <div className="border-t border-dashed border-border mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary tabular-nums text-lg">${total.toFixed(2)}</span>
            </div>
          </section>

          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
            <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              You won't be charged until the hotel confirms your booking.
            </p>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="max-w-2xl mx-auto flex items-center gap-3 p-3">
            <Button
              variant="outline"
              onClick={() => setStep("form")}
              className="h-12 px-4 rounded-2xl font-semibold text-sm active:scale-[0.98]"
            >
              Edit
            </Button>
            <Button
              onClick={confirmBooking}
              disabled={loading}
              className="flex-1 h-12 rounded-2xl font-semibold text-sm active:scale-[0.98] shadow-lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              {loading ? "Confirming…" : `Confirm · $${total.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== DETAILS STEP =====
  return (
    <div className="min-h-screen bg-background pb-32">
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
          </div>
          <div className="px-5 pb-1">
            <h1 className="text-lg font-bold tracking-tight">Booking summary</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              Secure booking · confirmed by the hotel
            </p>
          </div>
          <BookingStepper step={2} />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Hotel summary card */}
        {hotel && room && (
          <section className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="flex gap-3 p-4">
              <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden shrink-0">
                {hotel.cover_photo && <img src={hotel.cover_photo} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="truncate">{hotel.name}</span>
                  {hotel.is_verified && <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />{hotel.address}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <CalendarDays className="w-3 h-3 shrink-0" />{fmt(checkIn)} → {fmt(checkOut)} · {nights}N
                </p>
                <Badge variant="secondary" className="text-[10px] mt-1.5">{room.name}</Badge>
              </div>
            </div>
          </section>
        )}

        {/* Room number picker */}
        {units.length > 0 && (
          <section className="rounded-2xl bg-card border border-border p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Choose your room number</h3>
            <p className="text-xs text-muted-foreground mt-1">Locked rooms are already booked for these dates.</p>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {units.map((u) => {
                const taken = occupied.includes(u.id);
                const active = unitId === u.id;
                return (
                  <button
                    key={u.id}
                    disabled={taken}
                    onClick={() => setUnitId(active ? null : u.id)}
                    className={`h-12 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-1 transition ${
                      taken
                        ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                        : active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background"
                    }`}
                  >
                    {taken && <span aria-hidden>🔒</span>}
                    {u.room_number}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Primary contact */}
        <section className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Primary contact</h3>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-muted-foreground ml-1">Full name</label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="rounded-2xl h-12 mt-1" placeholder="Your name" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground ml-1">Phone</label>
              <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="rounded-2xl h-12 mt-1" placeholder="+231 …" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground ml-1">Email <span className="opacity-60">(optional)</span></label>
              <Input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="rounded-2xl h-12 mt-1" placeholder="you@example.com" />
            </div>
          </div>
        </section>

        {/* Guest list — accordion */}
        <section className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Guests · {guestDetails.length}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Name, age and ID for every guest checking in.</p>
          </div>
          <div className="divide-y divide-border">
            {guestDetails.map((g, i) => {
              const open = expandedGuest === i;
              const done = guestComplete(g);
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setExpandedGuest(open ? -1 : i)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                      done ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">
                        {g.name || `Guest ${i + 1}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {done ? `${g.age} yrs · ${ID_TYPES.find((t) => t.value === g.id_type)?.label} · ${g.id_number}` : "Tap to add details"}
                      </p>
                    </div>
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {open && (
                    <div className="px-4 pb-4 space-y-2.5">
                      <div className="grid grid-cols-[1fr_88px] gap-2">
                        <Input
                          placeholder="Full name"
                          value={g.name}
                          onChange={(e) => updateGuest(i, "name", e.target.value)}
                          className="rounded-2xl h-12"
                        />
                        <Input
                          type="number"
                          min={0}
                          placeholder="Age"
                          value={g.age}
                          onChange={(e) => updateGuest(i, "age", e.target.value)}
                          className="rounded-2xl h-12 tabular-nums"
                        />
                      </div>

                      {/* Segmented ID type chips */}
                      <div>
                        <p className="text-[11px] text-muted-foreground ml-1 mb-1.5">ID type</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ID_TYPES.map((t) => {
                            const sel = g.id_type === t.value;
                            return (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => updateGuest(i, "id_type", t.value)}
                                className={`h-9 px-3 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                                  sel
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                                }`}
                              >
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="relative">
                        <IdCard className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="ID number"
                          value={g.id_number}
                          onChange={(e) => updateGuest(i, "id_number", e.target.value)}
                          className="rounded-2xl h-12 pl-10 tabular-nums"
                        />
                      </div>

                      {i < guestDetails.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setExpandedGuest(i + 1)}
                          className="w-full h-11 rounded-2xl active:scale-[0.98]"
                          disabled={!done}
                        >
                          Next guest
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Price details */}
        <section className="rounded-2xl bg-card border border-border p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Price details</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">${room?.price_per_night || 0} × {nights} nights</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
            {losDiscount > 0 && (<div className="flex justify-between text-primary"><span>Long-stay discount ({losPct}%)</span><span className="tabular-nums">-${losDiscount.toFixed(2)}</span></div>)}
            {earlyBirdDiscount > 0 && (<div className="flex justify-between text-primary"><span>Early-bird discount ({ebPct}%)</span><span className="tabular-nums">-${earlyBirdDiscount.toFixed(2)}</span></div>)}
            {lastMinuteDiscount > 0 && (<div className="flex justify-between text-primary"><span>Last-minute deal ({lmPct}%)</span><span className="tabular-nums">-${lastMinuteDiscount.toFixed(2)}</span></div>)}
            <div className="flex justify-between"><span className="text-muted-foreground">Taxes & fees</span><span className="tabular-nums">${taxes.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span className="tabular-nums">${serviceFee.toFixed(2)}</span></div>
          </div>
          <div className="border-t border-dashed border-border mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary tabular-nums text-lg">${total.toFixed(2)}</span>
          </div>
        </section>

        {/* Payment method */}
        <section className="rounded-2xl bg-card border border-border p-4 space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Payment method</h3>
          {METHODS.map((m) => {
            const Icon = m.icon;
            const sel = method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                disabled={m.disabled}
                onClick={() => !m.disabled && setMethod(m.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.99] ${
                  sel ? "border-primary bg-primary/5" : "border-border"
                } ${m.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                  sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{m.label}</p>
                    {m.disabled && <Badge variant="secondary" className="text-[9px] h-4">Soon</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${sel ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                  {sel && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full m-auto mt-[5px]" />}
                </div>
              </button>
            );
          })}
        </section>

        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Safe & secure booking</p>
            <p className="text-[11px] text-muted-foreground">You won't be charged until the hotel confirms.</p>
          </div>
        </div>
      </main>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-3">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total · {nights}N</p>
            <p className="font-bold text-lg tabular-nums text-primary leading-tight">${total.toFixed(2)}</p>
          </div>
          <Button
            onClick={goReview}
            className="h-12 px-6 rounded-2xl font-semibold text-sm active:scale-[0.98] shadow-lg"
          >
            Review
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotelBooking;
