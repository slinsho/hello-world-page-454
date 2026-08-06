import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { QrCode, LogIn, LogOut, Search, User as UserIcon, Calendar, CheckCircle2, Receipt, Printer, Camera } from "lucide-react";

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);


const HotelCheckInPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<"arrivals" | "in-house" | "departures">("arrivals");
  const [scan, setScan] = useState("");
  const [showQr, setShowQr] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: h } = await supabase.from("hotels").select("id").eq("owner_id", user.id);
    const ids = (h || []).map((x: any) => x.id);
    if (!ids.length) { setBookings([]); return; }
    const { data } = await supabase.from("hotel_bookings").select("*").in("hotel_id", ids).eq("status", "confirmed");
    setBookings(data || []);
  };

  useEffect(() => { if (!user) { navigate("/auth"); return; } load(); }, [user, navigate]);

  const ensureCode = async (b: any) => {
    if (b.check_in_code) return b;
    const code = genCode();
    const { data } = await supabase.from("hotel_bookings").update({ check_in_code: code } as any).eq("id", b.id).select().single();
    setBookings((bs) => bs.map((x) => x.id === b.id ? data : x));
    return data;
  };

  const checkIn = async (b: any) => {
    const { data, error } = await supabase.from("hotel_bookings").update({ checked_in_at: new Date().toISOString() } as any).eq("id", b.id).select().single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setBookings((bs) => bs.map((x) => x.id === b.id ? data : x));
    toast({ title: `Checked in ${data.guest_name}` });
  };

  const checkOut = async (b: any) => {
    const { data, error } = await supabase.from("hotel_bookings").update({ checked_out_at: new Date().toISOString() } as any).eq("id", b.id).select().single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setBookings((bs) => bs.map((x) => x.id === b.id ? data : x));
    toast({ title: `Checked out ${data.guest_name}` });
    setReceipt(data);
  };

  const t = today();
  // Arrivals = every confirmed booking not yet checked in (today's and upcoming),
  // so the front desk can find a guest the moment they walk in.
  const arrivals = bookings
    .filter((b: any) => !b.checked_in_at)
    .sort((a: any, b: any) => a.check_in.localeCompare(b.check_in));
  const inHouse = bookings.filter((b: any) => b.checked_in_at && !b.checked_out_at);
  const departures = bookings.filter((b: any) => b.checked_in_at && !b.checked_out_at && b.check_out <= t);
  const list = tab === "arrivals" ? arrivals : tab === "in-house" ? inHouse : departures;

  const tabs = [
    { key: "arrivals", label: "Arrivals", count: arrivals.length },
    { key: "in-house", label: "In-house", count: inHouse.length },
    { key: "departures", label: "Checkout", count: departures.length },
  ] as const;

  // Accepts either the short check-in code or the full booking ID (what the QR encodes).
  const resolveBooking = (raw: string) => {
    const v = raw.trim();
    const up = v.toUpperCase();
    return bookings.find(
      (b: any) =>
        (b.check_in_code && b.check_in_code.toUpperCase() === up) ||
        b.id === v ||
        b.id.slice(0, 8).toUpperCase() === up
    );
  };

  const processCode = async (raw: string) => {
    const match = resolveBooking(raw);
    if (!match) { toast({ title: "Booking not found", description: "No confirmed booking matches that code.", variant: "destructive" }); return; }
    if (!match.checked_in_at) await checkIn(match);
    else if (!match.checked_out_at) await checkOut(match);
    else toast({ title: "Already completed" });
  };

  const submitScan = async () => {
    if (!scan.trim()) return;
    await processCode(scan);
    setScan("");
  };

  // ---- Camera QR scanning (uses the browser's built-in BarcodeDetector) ----
  const startCamera = async () => {
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      toast({ title: "Camera scanning unavailable", description: "This browser can't scan QR codes. Type the code instead.", variant: "destructive" });
      return;
    }
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes?.length) {
            const value = codes[0].rawValue as string;
            stopCamera();
            await processCode(value);
            return;
          }
        } catch { /* frame not ready */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      setScanning(false);
      toast({ title: "Camera blocked", description: e?.message || "Allow camera access to scan.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <HotelShellLayout title="Check-in" subtitle="Front desk">
      <div className="space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-4">
          <p className="text-xs uppercase tracking-wider opacity-80">Scan or enter guest code</p>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 flex items-center gap-2 bg-background/20 rounded-full px-3">
              <Search className="w-4 h-4 opacity-80" />
              <input value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitScan()} placeholder="e.g. AB3F9K" className="flex-1 bg-transparent h-10 outline-none placeholder:text-primary-foreground/60 uppercase" />
            </div>
            <button onClick={submitScan} className="h-10 px-4 rounded-full bg-background text-foreground font-semibold text-sm">Verify</button>
          </div>
          <button onClick={startCamera} className="mt-2 w-full h-10 rounded-full bg-background/20 text-sm font-semibold flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" />Scan guest QR code
          </button>
        </div>


        <div className="flex gap-2">
          {tabs.map((x) => (
            <button key={x.key} onClick={() => setTab(x.key)} className={`flex-1 h-9 rounded-full text-[13px] font-semibold border ${tab === x.key ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground"}`}>
              {x.label} · {x.count}
            </button>
          ))}
        </div>

        {list.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">Nothing here yet.</div>
        )}

        <div className="space-y-3">
          {list.map((b: any) => (
            <div key={b.id} className="rounded-3xl bg-background border p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {(b.guest_name || "G").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{b.guest_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />{b.check_in} → {b.check_out}</p>
                  {b.check_in_code && <p className="text-[11px] font-mono mt-1 tracking-widest text-primary">CODE: {b.check_in_code}</p>}
                </div>
                <button
                  onClick={async () => { const upd = await ensureCode(b); setShowQr(upd); }}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
                  aria-label="Show QR"
                ><QrCode className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2 mt-3">
                {!b.checked_in_at && (
                  <Button onClick={() => checkIn(b)} className="flex-1 rounded-full h-10"><LogIn className="w-4 h-4 mr-1" />Check-in</Button>
                )}
                {b.checked_in_at && !b.checked_out_at && (
                  <Button onClick={() => checkOut(b)} variant="secondary" className="flex-1 rounded-full h-10"><LogOut className="w-4 h-4 mr-1" />Check-out</Button>
                )}
                {b.checked_out_at && (
                  <div className="flex-1 text-center text-emerald-600 text-sm font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" />Completed</div>
                )}
                <Button variant="outline" onClick={() => setReceipt(b)} className="rounded-full h-10 px-3" aria-label="View receipt">
                  <Receipt className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!showQr} onOpenChange={(o) => { if (!o) setShowQr(null); }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Guest QR</DialogTitle>
              <DialogDescription className="sr-only">Scan this code at the front desk to check in or out.</DialogDescription>
            </DialogHeader>
            {showQr && (
              <div className="text-center space-y-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(showQr.check_in_code || "")}`}
                  alt="QR" className="mx-auto rounded-2xl border"
                />
                <p className="font-mono text-lg tracking-widest">{showQr.check_in_code}</p>
                <p className="text-xs text-muted-foreground">{showQr.guest_name} · {showQr.check_in} → {showQr.check_out}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!receipt} onOpenChange={(o) => { if (!o) setReceipt(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Payment receipt</DialogTitle>
              <DialogDescription className="sr-only">Booking payment summary for this guest.</DialogDescription>
            </DialogHeader>
            {receipt && (
              <div id="stay-receipt" className="space-y-3 text-sm">
                <div className="rounded-2xl border p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-semibold">{receipt.guest_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Stay</span><span>{receipt.check_in} → {receipt.check_out}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Guests / rooms</span><span>{receipt.guests} · {receipt.rooms}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Checked in</span><span>{receipt.checked_in_at ? new Date(receipt.checked_in_at).toLocaleString() : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Checked out</span><span>{receipt.checked_out_at ? new Date(receipt.checked_out_at).toLocaleString() : "—"}</span></div>
                </div>
                <div className="rounded-2xl border p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(receipt.subtotal || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>${Number(receipt.taxes || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span>${Number(receipt.service_fee || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold text-base"><span>Total</span><span>${Number(receipt.total || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="capitalize">{receipt.payment_method}</span></div>
                  {receipt.payment_reference && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{receipt.payment_reference}</span></div>
                  )}
                </div>
                <Button onClick={() => window.print()} className="w-full rounded-full h-11"><Printer className="w-4 h-4 mr-1" />Print receipt</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </HotelShellLayout>
  );
};

export default HotelCheckInPage;