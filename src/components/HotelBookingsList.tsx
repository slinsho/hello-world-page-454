import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Hotel, QrCode, Download, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

const qrUrl = (data: string, size = 320) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;

/**
 * Guest cancellation window / refund rules:
 *  - more than 48h before check-in  → full refund
 *  - 24h–48h before check-in        → 50% refund
 *  - less than 24h                  → no refund
 */
export const refundForBooking = (b: any) => {
  const hours = (new Date(`${b.check_in}T12:00:00`).getTime() - Date.now()) / 3600000;
  const total = Number(b.total || 0);
  if (hours >= 48) return { pct: 100, amount: total, label: "Full refund" };
  if (hours >= 24) return { pct: 50, amount: total * 0.5, label: "50% refund" };
  return { pct: 0, amount: 0, label: "No refund" };
};

export const HotelBookingsList = ({ userId }: { userId: string }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [cancelling, setCancelling] = useState<any>(null);
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

  // Downloads the QR image so the guest can keep it offline / print it.
  const downloadQr = async (b: any) => {
    try {
      const res = await fetch(qrUrl(b.check_in_code || b.id, 600));
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `booking-${b.check_in_code || b.id.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(qrUrl(b.check_in_code || b.id, 600), "_blank");
    }
  };

  const confirmCancel = async () => {
    const b = cancelling;
    if (!b) return;
    const r = refundForBooking(b);
    const { data } = await supabase.from("hotel_bookings").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: "guest",
      cancellation_reason: "Cancelled by guest",
      refund_amount: r.amount,
      refund_status: r.amount > 0 ? "pending" : "not_eligible",
    } as any).eq("id", b.id).select().single();
    setBookings((bs) => bs.map((x) => (x.id === b.id ? { ...x, ...(data || {}) } : x)));
    setCancelling(null);
  };

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
              <div className="flex items-center gap-2">
                {b.status === "confirmed" && !b.checked_out_at && (
                  <button
                    onClick={() => setTicket(b)}
                    className="text-[11px] font-semibold text-primary flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />Check-in QR
                  </button>
                )}
                {["pending", "confirmed"].includes(b.status) && !b.checked_in_at && (
                  <button
                    onClick={() => setCancelling(b)}
                    className="text-[11px] font-semibold text-destructive flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />Cancel
                  </button>
                )}
                {(b.checked_out_at || b.status === "completed") && (
                  <button
                    onClick={() => navigate(`/hotels/${b.hotel_id}?review=1`)}
                    className="text-[11px] font-semibold text-primary underline underline-offset-2"
                  >
                    Leave a review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <Dialog open={!!cancelling} onOpenChange={(o) => { if (!o) setCancelling(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              {cancelling && (
                <>Cancelling now gives you <strong>{refundForBooking(cancelling).label}</strong>
                {refundForBooking(cancelling).amount > 0 && <> (${refundForBooking(cancelling).amount.toFixed(2)})</>}.
                Free cancellation up to 48 hours before check-in, 50% up to 24 hours, none after that.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setCancelling(null)}>Keep booking</Button>
            <Button variant="destructive" className="flex-1 rounded-full" onClick={confirmCancel}>Cancel booking</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ticket} onOpenChange={(o) => { if (!o) setTicket(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Your check-in pass</DialogTitle>
            <DialogDescription className="sr-only">Show this QR code or booking ID at the hotel front desk.</DialogDescription>
          </DialogHeader>
          {ticket && (
            <div className="text-center space-y-3">
              <img
                src={qrUrl(ticket.check_in_code || ticket.id)}
                alt="Booking QR code"
                className="mx-auto rounded-2xl border bg-white p-2"
                width={280}
                height={280}
              />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Booking ID</p>
                <p className="font-mono text-lg tracking-widest">{ticket.check_in_code || ticket.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {ticket.hotels?.name} · {ticket.check_in} → {ticket.check_out}
              </p>
              <Button onClick={() => downloadQr(ticket)} className="w-full rounded-full h-11">
                <Download className="w-4 h-4 mr-1" />Download QR
              </Button>
              <p className="text-[11px] text-muted-foreground">Show this at the front desk to check in and out.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
