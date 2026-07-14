import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShieldCheck, Lock, CalendarDays, MapPin, User, Building2, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const METHODS = [
  { value: "pay_at_hotel", label: "Pay at Hotel", desc: "Pay when you check-in at the hotel", disabled: false },
  { value: "mobile_money", label: "Mobile Money", desc: "MTN MoMo, Orange Money — coming soon", disabled: true },
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
  const [method, setMethod] = useState("pay_at_hotel");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestDetails, setGuestDetails] = useState<{ name: string; age: string }[]>(
    Array.from({ length: guestsN }, () => ({ name: "", age: "" }))
  );
  const [step, setStep] = useState<"form" | "review">("form");

  useEffect(() => {
    (async () => {
      const { data: h } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
      const { data: r } = await supabase.from("hotel_rooms").select("*").eq("id", roomId).maybeSingle();
      setHotel(h); setRoom(r);
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("name, phone, email").eq("id", user.id).maybeSingle();
        if (prof) { setGuestName(prof.name || ""); setGuestPhone(prof.phone || ""); setGuestEmail(prof.email || ""); }
      }
    })();
  }, [id, roomId, user]);

  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;
  const subtotal = room ? Number(room.price_per_night) * nights : 0;
  const taxes = +(subtotal * 0.1).toFixed(2);
  const serviceFee = +(subtotal * 0.05).toFixed(2);
  const total = subtotal + taxes + serviceFee;

  const updateGuest = (i: number, field: "name" | "age", value: string) => {
    setGuestDetails((g) => g.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));
  };

  const goReview = () => {
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to book.", variant: "destructive" }); navigate("/auth"); return; }
    if (!guestName || !guestPhone) { toast({ title: "Name and phone required", variant: "destructive" }); return; }
    for (let i = 0; i < guestDetails.length; i++) {
      if (!guestDetails[i].name || !guestDetails[i].age) {
        toast({ title: `Guest ${i + 1} details required`, description: "Enter name and age for every guest.", variant: "destructive" });
        return;
      }
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmBooking = async () => {
    if (!user) return;
    setLoading(true);
    const { data: booking, error } = await supabase.from("hotel_bookings").insert({
      hotel_id: id, room_id: roomId, guest_id: user.id,
      guest_name: guestName, guest_phone: guestPhone, guest_email: guestEmail || null,
      check_in: checkIn, check_out: checkOut, guests: guestsN, rooms: 1,
      subtotal, taxes, service_fee: serviceFee, total,
      payment_method: method, payment_reference: paymentRef || null,
      guest_details: guestDetails as any,
    } as any).select().single();
    setLoading(false);
    if (error) { toast({ title: "Booking failed", description: error.message, variant: "destructive" }); return; }

    // Notify the hotel manager with the guest's phone number
    if (hotel?.owner_id) {
      await supabase.from("notifications").insert({
        user_id: hotel.owner_id,
        title: `New booking for ${hotel.name}`,
        message: `${guestName} booked ${room?.name} (${checkIn} → ${checkOut}). Contact: ${guestPhone}${guestEmail ? " · " + guestEmail : ""}`,
        type: "status_updates",
      } as any);
    }

    toast({ title: "Booking submitted!", description: "The hotel will confirm your booking shortly." });
    navigate("/profile");
  };

  if (step === "review") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setStep("form")}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1 text-center">
              <h1 className="font-bold">Review Booking</h1>
              <p className="text-[10px] text-muted-foreground">Confirm the details below</p>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          {hotel && room && (
            <div className="border border-border rounded-2xl p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                  {hotel.cover_photo && <img src={hotel.cover_photo} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <Building2 className="w-4 h-4 text-primary" />{hotel.name}
                    {hotel.is_verified && <ShieldCheck className="w-4 h-4 text-green-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{hotel.address}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">{room.name}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div className="text-xs">
                  <p className="text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />Check-in</p>
                  <p className="font-semibold">{checkIn}</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />Check-out</p>
                  <p className="font-semibold">{checkOut}</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Nights</p>
                  <p className="font-semibold">{nights}</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />Guests</p>
                  <p className="font-semibold">{guestsN}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border border-border rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm">Primary Contact</h3>
            <div className="text-sm space-y-1">
              <p className="flex items-center gap-2"><User className="w-3 h-3 text-muted-foreground" />{guestName}</p>
              <p className="flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground" />{guestPhone}</p>
              {guestEmail && <p className="flex items-center gap-2"><Mail className="w-3 h-3 text-muted-foreground" />{guestEmail}</p>}
            </div>
          </div>

          <div className="border border-border rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm">Guests ({guestDetails.length})</h3>
            {guestDetails.map((g, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-dashed border-border last:border-0 py-1.5">
                <span>{i + 1}. {g.name}</span>
                <span className="text-muted-foreground">{g.age} yrs</span>
              </div>
            ))}
          </div>

          <div className="border border-border rounded-2xl p-4 space-y-1">
            <h3 className="font-bold text-sm mb-2">Payment</h3>
            <p className="text-sm font-semibold">{METHODS.find((m) => m.value === method)?.label}</p>
            <div className="border-t border-dashed border-border my-2" />
            <div className="flex justify-between text-sm"><span>${room?.price_per_night || 0} x {nights} Nights</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Taxes & Fees</span><span>${taxes.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Service Fee</span><span>${serviceFee.toFixed(2)}</span></div>
            <div className="border-t border-dashed border-border my-2" />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("form")} className="flex-1 h-14 rounded-2xl">Edit</Button>
            <Button onClick={confirmBooking} disabled={loading} className="flex-1 h-14 rounded-2xl font-semibold">
              <Lock className="w-4 h-4 mr-2" />{loading ? "Confirming..." : "Confirm Booking"}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1 text-center">
            <h1 className="font-bold">Booking Summary</h1>
            <Badge className="bg-green-600 text-white gap-1 mt-0.5 h-5 text-[10px]"><ShieldCheck className="w-3 h-3" />Secure Booking</Badge>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {hotel && room && (
          <div className="border border-border rounded-2xl p-3 flex gap-3">
            <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden shrink-0">
              {hotel.cover_photo && <img src={hotel.cover_photo} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1 font-bold">{hotel.name}{hotel.is_verified && <ShieldCheck className="w-4 h-4 text-green-600" />}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{hotel.address}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />{checkIn} → {checkOut} ({nights}N)</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{guestsN} Guests</p>
              <Badge variant="secondary" className="text-[10px]">{room.name}</Badge>
            </div>
          </div>
        )}

        <div className="border border-border rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-sm mb-1">Primary Contact</h3>
          <Input placeholder="Full Name *" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="rounded-xl" />
          <Input placeholder="Phone *" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="rounded-xl" />
          <Input placeholder="Email (optional)" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="rounded-xl" />
        </div>

        <div className="border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">Guest List ({guestDetails.length})</h3>
          <p className="text-xs text-muted-foreground -mt-1">Enter the name and age of every guest checking in.</p>
          {guestDetails.map((g, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px] gap-2 items-center">
              <Input
                placeholder={`Guest ${i + 1} full name`}
                value={g.name}
                onChange={(e) => updateGuest(i, "name", e.target.value)}
                className="rounded-xl"
              />
              <Input
                type="number"
                min={0}
                placeholder="Age"
                value={g.age}
                onChange={(e) => updateGuest(i, "age", e.target.value)}
                className="rounded-xl"
              />
            </div>
          ))}
        </div>

        <div className="border border-border rounded-2xl p-4 space-y-1">
          <h3 className="font-bold text-sm mb-2">Price Details</h3>
          <div className="flex justify-between text-sm"><span>${room?.price_per_night || 0} x {nights} Nights</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span>Taxes & Fees</span><span>${taxes.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span>Service Fee</span><span>${serviceFee.toFixed(2)}</span></div>
          <div className="border-t border-dashed border-border my-2" />
          <div className="flex justify-between font-bold text-base"><span>Total Amount</span><span className="text-primary">${total.toFixed(2)}</span></div>
        </div>

        <div className="border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">Payment Method</h3>
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={m.disabled}
              onClick={() => !m.disabled && setMethod(m.value)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border transition ${
                method === m.value ? "border-primary bg-primary/5" : "border-border"
              } ${m.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 ${method === m.value ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {method === m.value && <div className="w-2 h-2 bg-white rounded-full m-auto mt-[3px]" />}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{m.label}</p>
                  {m.disabled && <Badge variant="secondary" className="text-[9px] h-4">Coming soon</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Safe & Secure Booking</p>
            <p className="text-xs text-muted-foreground">Your details are protected. You won't be charged until the hotel confirms.</p>
          </div>
        </div>

        <Button onClick={goReview} className="w-full h-14 rounded-2xl text-base font-semibold">
          Review Booking
        </Button>
      </main>
    </div>
  );
};

export default HotelBooking;
