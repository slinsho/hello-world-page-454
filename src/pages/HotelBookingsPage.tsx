import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarCheck, User as UserIcon, Phone, Calendar, Users as UsersIcon, Check, X, Receipt, Printer, LogOut, Download, AlertTriangle, Bell } from "lucide-react";
import { useHotelScope } from "@/hooks/useHotelScope";
import { downloadReceiptPdf } from "@/lib/hotelReceipt";

const HotelBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [receipt, setReceipt] = useState<any>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmt, setRefundAmt] = useState("");
  const { hotelIds, loading: scopeLoading } = useHotelScope();

  const load = async (ids: string[]) => {
    if (!ids.length) { setBookings([]); return; }
    const { data } = await supabase.from("hotel_bookings").select("*").in("hotel_id", ids).order("created_at", { ascending: false });
    setBookings(data || []);
  };

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (scopeLoading) return;
    load(hotelIds);
    // Realtime: check-in / check-out / status changes appear instantly.
    const ch = supabase
      .channel("bookings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "hotel_bookings" }, () => load(hotelIds))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, navigate, scopeLoading, hotelIds.join(",")]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("hotel_bookings").update({ status }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setBookings(bookings.map((b) => b.id === id ? { ...b, status } : b));
    toast({ title: `Booking ${status}` });
  };

  const cancelBooking = async () => {
    if (!cancelTarget) return;
    const { error } = await supabase.from("hotel_bookings").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: "hotel",
      cancellation_reason: cancelReason || "Cancelled by hotel",
      refund_amount: Number(refundAmt || 0),
      refund_status: Number(refundAmt || 0) > 0 ? "pending" : "not_eligible",
    } as any).eq("id", cancelTarget.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setCancelTarget(null); setCancelReason(""); setRefundAmt("");
    load(hotelIds);
    toast({ title: "Booking cancelled" });
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const tabs = [
    { key: "all", label: "All", count: bookings.length },
    { key: "pending", label: "Pending", count: bookings.filter((b) => b.status === "pending").length },
    { key: "confirmed", label: "Confirmed", count: bookings.filter((b) => b.status === "confirmed").length },
    { key: "cancelled", label: "Cancelled", count: bookings.filter((b) => b.status === "cancelled").length },
  ];
  // Revenue is only earned once the guest actually checks in — a confirmed
  // booking alone does not add to the balance.
  const totalRevenue = bookings.filter((b) => b.checked_in_at).reduce((s, b) => s + Number(b.total || 0), 0);
  const pendingRevenue = bookings.filter((b) => b.status === "confirmed" && !b.checked_in_at).reduce((s, b) => s + Number(b.total || 0), 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const readyToCheckIn = bookings.filter((b) => b.status === "confirmed" && !b.checked_in_at);
  const noShows = bookings.filter((b) => b.status === "confirmed" && !b.checked_in_at && b.check_in < todayStr);

  const markCheckedOut = async (b: any) => {
    const { data, error } = await supabase.from("hotel_bookings").update({ checked_out_at: new Date().toISOString() } as any).eq("id", b.id).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setBookings((bs) => bs.map((x) => x.id === b.id ? data : x));
    setReceipt(data);
  };

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-700 border-amber-500/20",
    confirmed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
    cancelled: "bg-rose-500/15 text-rose-700 border-rose-500/20",
  };

  return (
    <HotelShellLayout title="Bookings" subtitle="Guest reservations">
      <div className="space-y-4">
        {/* Revenue hero */}
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-5 shadow-lg shadow-primary/20">
          <p className="text-xs uppercase tracking-wider opacity-80">Earned revenue (checked-in)</p>
          <p className="text-3xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs opacity-80 mt-1">${pendingRevenue.toFixed(2)} awaiting check-in · {bookings.length} total bookings</p>
        </div>

        {/* No-show alerts */}
        {noShows.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm font-semibold flex items-center gap-1 text-rose-600"><AlertTriangle className="w-4 h-4" />{noShows.length} no-show{noShows.length > 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground mt-1">These guests never arrived on their check-in date.</p>
            <div className="mt-2 space-y-2">
              {noShows.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{b.guest_name} · {b.check_in}</span>
                  <button onClick={() => updateStatus(b.id, "no_show")} className="shrink-0 h-8 px-3 rounded-full bg-rose-600 text-white text-xs font-semibold">Mark no-show</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ready to check-in */}
        {readyToCheckIn.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold flex items-center gap-1 text-emerald-700"><Bell className="w-4 h-4" />Ready to check-in · {readyToCheckIn.length}</p>
            <div className="mt-2 space-y-2">
              {readyToCheckIn.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{b.guest_name} · {b.check_in}</span>
                  <button onClick={() => navigate("/hotel-dashboard/check-in")} className="shrink-0 h-8 px-3 rounded-full bg-emerald-600 text-white text-xs font-semibold">Check in</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Segmented pills */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold border transition-colors ${
                filter === t.key ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border"
              }`}
            >
              {t.label} <span className="opacity-70">· {t.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <CalendarCheck className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No bookings</p>
            <p className="text-sm text-muted-foreground mt-1">New guest reservations will appear here.</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-3xl bg-background border p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {(b.guest_name || "G").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[15px] truncate">{b.guest_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[b.status] || "bg-muted text-muted-foreground"}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{b.guest_phone || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-2xl bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" />Check-in</p>
                  <p className="text-[13px] font-semibold mt-0.5">{b.check_in}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" />Check-out</p>
                  <p className="text-[13px] font-semibold mt-0.5">{b.check_out}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><UsersIcon className="w-3 h-3" />{b.guests} guests</p>
                <p className="text-base font-bold text-primary">${Number(b.total).toFixed(2)}</p>
              </div>

              {b.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setCancelTarget(b); setRefundAmt(String(b.total || 0)); }}
                    className="flex-1 h-10 rounded-full border border-border text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4" />Decline
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="flex-1 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1 shadow-lg shadow-primary/20"
                  >
                    <Check className="w-4 h-4" />Confirm
                  </button>
                </div>
              )}

              {b.status === "confirmed" && !b.checked_in_at && (
                <button
                  onClick={() => { setCancelTarget(b); setRefundAmt(String(b.total || 0)); }}
                  className="mt-3 w-full h-10 rounded-full border border-destructive/40 text-destructive text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />Cancel booking
                </button>
              )}

              {b.status === "cancelled" && b.cancellation_reason && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {b.cancellation_reason} · Refund: ${Number(b.refund_amount || 0).toFixed(2)} ({b.refund_status})
                </p>
              )}

              {b.checked_in_at && !b.checked_out_at && (
                <button
                  onClick={() => markCheckedOut(b)}
                  className="mt-3 w-full h-10 rounded-full border border-border text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <LogOut className="w-4 h-4" />Mark checked out
                </button>
              )}

              {b.checked_out_at && (
                <button
                  onClick={() => setReceipt(b)}
                  className="mt-3 w-full h-10 rounded-full bg-muted text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <Receipt className="w-4 h-4" />View receipt
                </button>
              )}
            </div>
          ))}
        </div>

        <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Cancel booking</DialogTitle>
              <DialogDescription>Give a reason and the refund amount owed to the guest.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Reason (e.g. room unavailable)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
              <Input type="number" placeholder="Refund amount (USD)" value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setCancelTarget(null)}>Back</Button>
                <Button variant="destructive" className="flex-1 rounded-full" onClick={cancelBooking}>Confirm cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!receipt} onOpenChange={(o) => { if (!o) setReceipt(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Payment receipt</DialogTitle>
              <DialogDescription className="sr-only">Booking payment summary for this guest.</DialogDescription>
            </DialogHeader>
            {receipt && (
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-semibold">{receipt.guest_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Stay</span><span>{receipt.check_in} → {receipt.check_out}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Checked in</span><span>{receipt.checked_in_at ? new Date(receipt.checked_in_at).toLocaleString() : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Checked out</span><span>{receipt.checked_out_at ? new Date(receipt.checked_out_at).toLocaleString() : "—"}</span></div>
                </div>
                <div className="rounded-2xl border p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(receipt.subtotal || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>${Number(receipt.taxes || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span>${Number(receipt.service_fee || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold text-base"><span>Total</span><span>${Number(receipt.total || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="capitalize">{receipt.payment_method}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => window.print()} variant="outline" className="flex-1 rounded-full h-11"><Printer className="w-4 h-4 mr-1" />Print</Button>
                  <Button onClick={() => downloadReceiptPdf(receipt)} className="flex-1 rounded-full h-11"><Download className="w-4 h-4 mr-1" />PDF</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

    </HotelShellLayout>
  );
};

export default HotelBookingsPage;