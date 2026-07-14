import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShieldCheck, Lock, CalendarDays, MapPin, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const METHODS = [
  { value: "pay_online", label: "Pay Online", desc: "Pay securely using card, MoMo, or bank transfer" },
  { value: "pay_at_hotel", label: "Pay at Hotel", desc: "Pay when you check-in at the hotel" },
  { value: "mobile_money", label: "Mobile Money", desc: "MTN MoMo, Orange Money" },
  { value: "bank_transfer", label: "Bank Transfer", desc: "Transfer directly to hotel's bank account" },
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
  const [method, setMethod] = useState("pay_online");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [loading, setLoading] = useState(false);

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

  const confirmBooking = async () => {
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to book.", variant: "destructive" }); navigate("/auth"); return; }
    if (!guestName || !guestPhone) { toast({ title: "Name and phone required", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.from("hotel_bookings").insert({
      hotel_id: id, room_id: roomId, guest_id: user.id,
      guest_name: guestName, guest_phone: guestPhone, guest_email: guestEmail || null,
      check_in: checkIn, check_out: checkOut, guests: guestsN, rooms: 1,
      subtotal, taxes, service_fee: serviceFee, total,
      payment_method: method, payment_reference: paymentRef || null,
    });
    setLoading(false);
    if (error) { toast({ title: "Booking failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Booking submitted!", description: "The hotel will confirm your booking shortly." });
    navigate("/profile");
  };

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
          <h3 className="font-bold text-sm mb-1">Guest Details</h3>
          <Input placeholder="Full Name *" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="rounded-xl" />
          <Input placeholder="Phone *" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="rounded-xl" />
          <Input placeholder="Email (optional)" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="rounded-xl" />
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
            <button key={m.value} onClick={() => setMethod(m.value)} className={`w-full flex items-start gap-3 p-3 rounded-xl border ${method === m.value ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 ${method === m.value ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {method === m.value && <div className="w-2 h-2 bg-white rounded-full m-auto mt-[3px]" />}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
          {method !== "pay_online" && (
            <Input placeholder="Payment reference (Sender Name - Ref)" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="rounded-xl mt-2" />
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Safe & Secure Booking</p>
            <p className="text-xs text-muted-foreground">Your details are protected. You won't be charged until the hotel confirms.</p>
          </div>
        </div>

        <Button onClick={confirmBooking} disabled={loading} className="w-full h-14 rounded-2xl text-base font-semibold">
          <Lock className="w-4 h-4 mr-2" />{loading ? "Confirming..." : "Confirm Booking"}
        </Button>
      </main>
    </div>
  );
};

export default HotelBooking;
