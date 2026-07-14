import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { QrCode, LogIn, LogOut, Search, User as UserIcon, Calendar, CheckCircle2 } from "lucide-react";

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
  };

  const t = today();
  const arrivals = bookings.filter((b: any) => b.check_in <= t && !b.checked_in_at);
  const inHouse = bookings.filter((b: any) => b.checked_in_at && !b.checked_out_at);
  const departures = bookings.filter((b: any) => b.checked_in_at && !b.checked_out_at && b.check_out <= t);
  const list = tab === "arrivals" ? arrivals : tab === "in-house" ? inHouse : departures;

  const tabs = [
    { key: "arrivals", label: "Arrivals", count: arrivals.length },
    { key: "in-house", label: "In-house", count: inHouse.length },
    { key: "departures", label: "Checkout", count: departures.length },
  ] as const;

  const submitScan = async () => {
    const code = scan.trim().toUpperCase();
    const match = bookings.find((b: any) => b.check_in_code === code);
    if (!match) return toast({ title: "Code not found", variant: "destructive" });
    if (!match.checked_in_at) await checkIn(match);
    else if (!match.checked_out_at) await checkOut(match);
    setScan("");
  };

  return (
    <HotelShellLayout title="Check-in" subtitle="Front desk">
      <div className="space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-4">
          <p className="text-xs uppercase tracking-wider opacity-80">Enter guest code</p>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 flex items-center gap-2 bg-background/20 rounded-full px-3">
              <Search className="w-4 h-4 opacity-80" />
              <input value={scan} onChange={(e) => setScan(e.target.value)} placeholder="e.g. AB3F9K" className="flex-1 bg-transparent h-10 outline-none placeholder:text-primary-foreground/60 uppercase" />
            </div>
            <button onClick={submitScan} className="h-10 px-4 rounded-full bg-background text-foreground font-semibold text-sm">Verify</button>
          </div>
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
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!showQr} onOpenChange={(o) => { if (!o) setShowQr(null); }}>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>Guest QR</DialogTitle></DialogHeader>
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
      </div>
    </HotelShellLayout>
  );
};

export default HotelCheckInPage;