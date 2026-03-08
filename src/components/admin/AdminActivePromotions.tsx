import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInSeconds, addMonths } from "date-fns";
import { Crown, Timer, Eye, MapPin, DollarSign, User, Calendar, TrendingUp, ArrowLeft, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ActivePromotion {
  id: string;
  property_id: string;
  user_id: string;
  duration_months: number;
  payment_amount: number;
  payment_reference: string | null;
  payment_confirmed_at: string;
  created_at: string;
  admin_note: string | null;
  property: {
    id: string;
    title: string;
    county: string;
    price_usd: number;
    photos: string[];
    listing_type: string;
    property_type: string;
    bedrooms: number | null;
    bathrooms: number | null;
    status: string;
  } | null;
  profile: { name: string; email: string; role: string; phone: string | null } | null;
  views_count: number;
  inquiries_count: number;
}

function CountdownTimer({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiresAt));

  function calculateTimeLeft(target: Date) {
    const diff = differenceInSeconds(target, new Date());
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return { days, hours, minutes, seconds, expired: false };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft.expired) {
    return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  }

  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      <Timer className="h-3.5 w-3.5 text-primary" />
      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{timeLeft.days}d</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{String(timeLeft.hours).padStart(2, "0")}h</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{String(timeLeft.minutes).padStart(2, "0")}m</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{String(timeLeft.seconds).padStart(2, "0")}s</span>
    </div>
  );
}

export function AdminActivePromotions() {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<ActivePromotion | null>(null);
  const [revokeNote, setRevokeNote] = useState("");
  const [revoking, setRevoking] = useState(false);
  const { toast } = useToast();

  const fetchActivePromotions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("promotion_requests")
        .select("*")
        .eq("status", "approved")
        .eq("payment_status", "confirmed")
        .order("payment_confirmed_at", { ascending: false });

      if (error || !data) { setLoading(false); return; }

      const propertyIds = [...new Set(data.map((r: any) => r.property_id))];
      const userIds = [...new Set(data.map((r: any) => r.user_id))];

      // Find earliest promotion start date per property to filter views/inquiries
      const promoStartDates: Record<string, string> = {};
      data.forEach((r: any) => {
        const start = r.payment_confirmed_at;
        if (start && (!promoStartDates[r.property_id] || start < promoStartDates[r.property_id])) {
          promoStartDates[r.property_id] = start;
        }
      });

      const [{ data: properties }, { data: profiles }] = await Promise.all([
        supabase.from("properties").select("id, title, county, price_usd, photos, listing_type, property_type, bedrooms, bathrooms, status").in("id", propertyIds.length ? propertyIds : ["_"]),
        supabase.from("profiles").select("id, name, email, role, phone").in("id", userIds.length ? userIds : ["_"]),
      ]);

      // Fetch views and inquiries only since each property's promotion start
      const viewPromises = propertyIds.map(async (pid) => {
        const since = promoStartDates[pid];
        if (!since) return { pid, count: 0 };
        const { count } = await supabase.from("property_views").select("*", { count: "exact", head: true }).eq("property_id", pid).gte("viewed_at", since);
        return { pid, count: count || 0 };
      });
      const inquiryPromises = propertyIds.map(async (pid) => {
        const since = promoStartDates[pid];
        if (!since) return { pid, count: 0 };
        const { count } = await supabase.from("property_inquiries").select("*", { count: "exact", head: true }).eq("property_id", pid).gte("created_at", since);
        return { pid, count: count || 0 };
      });

      const [viewResults, inquiryResults] = await Promise.all([
        Promise.all(viewPromises),
        Promise.all(inquiryPromises),
      ]);

      const propMap = new Map(properties?.map((p) => [p.id, p]));
      const profMap = new Map(profiles?.map((p) => [p.id, p]));

      const viewCounts: Record<string, number> = {};
      views?.forEach((v: any) => { viewCounts[v.property_id] = (viewCounts[v.property_id] || 0) + 1; });

      const inquiryCounts: Record<string, number> = {};
      inquiries?.forEach((i: any) => { inquiryCounts[i.property_id] = (inquiryCounts[i.property_id] || 0) + 1; });

      setPromotions(data.map((r: any) => ({
        ...r,
        duration_months: r.duration_months || 1,
        payment_amount: r.payment_amount || 0,
        property: propMap.get(r.property_id) || null,
        profile: profMap.get(r.user_id) || null,
        views_count: viewCounts[r.property_id] || 0,
        inquiries_count: inquiryCounts[r.property_id] || 0,
      })));
    } catch (err) {
      console.error("Error fetching active promotions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivePromotions(); }, [fetchActivePromotions]);

  const getExpiryDate = (promo: ActivePromotion) => {
    return addMonths(new Date(promo.payment_confirmed_at), promo.duration_months);
  };

  const handleRevoke = async (promo: ActivePromotion) => {
    if (!revokeNote.trim()) {
      toast({ title: "Note Required", description: "Please provide a reason for revoking.", variant: "destructive" });
      return;
    }
    setRevoking(true);
    try {
      await supabase.from("promotion_requests").update({ status: "revoked", admin_note: revokeNote } as any).eq("id", promo.id);
      await supabase.from("properties").update({ is_promoted: false }).eq("id", promo.property_id);
      await supabase.from("notifications").insert({
        user_id: promo.user_id,
        property_id: promo.property_id,
        title: "Promotion Revoked",
        message: `Your promotion for "${promo.property?.title}" has been revoked. Reason: ${revokeNote}`,
      });
      toast({ title: "Promotion Revoked" });
      setSelectedPromo(null);
      setRevokeNote("");
      fetchActivePromotions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return <div className="mt-6 text-center text-muted-foreground py-12">Loading active promotions...</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Active Promotions ({promotions.length})
        </h2>
      </div>

      {promotions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No active promotions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => {
            const expiry = getExpiryDate(promo);
            const isExpired = expiry <= new Date();

            return (
              <Card
                key={promo.id}
                className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${isExpired ? "border-l-destructive opacity-70" : "border-l-primary"}`}
                onClick={() => setSelectedPromo(promo)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    {promo.property?.photos?.[0] && (
                      <img src={promo.property.photos[0]} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{promo.property?.title || "Unknown"}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {promo.property?.county}
                      </p>
                      <p className="text-xs text-muted-foreground">${promo.property?.price_usd?.toLocaleString()}</p>
                    </div>
                  </div>

                  <CountdownTimer expiresAt={expiry} />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {promo.views_count} views</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {promo.inquiries_count} inquiries</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{promo.profile?.name}</span>
                    <Badge variant="outline" className="text-xs">{promo.duration_months}mo</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedPromo} onOpenChange={(open) => { if (!open) { setSelectedPromo(null); setRevokeNote(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedPromo && (() => {
            const expiry = getExpiryDate(selectedPromo);
            const isExpired = expiry <= new Date();
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-4 w-4 text-primary" />
                    Promotion Details
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  {/* Property */}
                  <div className="flex gap-3 bg-secondary/30 rounded-lg p-3">
                    {selectedPromo.property?.photos?.[0] && (
                      <img src={selectedPromo.property.photos[0]} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">{selectedPromo.property?.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedPromo.property?.county} · ${selectedPromo.property?.price_usd?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{selectedPromo.property?.property_type} · {selectedPromo.property?.listing_type?.replace("_", " ")}</p>
                      {(selectedPromo.property?.bedrooms || selectedPromo.property?.bathrooms) && (
                        <p className="text-xs text-muted-foreground">{selectedPromo.property?.bedrooms} bed · {selectedPromo.property?.bathrooms} bath</p>
                      )}
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Time Remaining</p>
                    <div className="flex justify-center">
                      <CountdownTimer expiresAt={expiry} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(expiry, "PPP 'at' p")}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{selectedPromo.views_count}</p>
                      <p className="text-xs text-muted-foreground">Total Views</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{selectedPromo.inquiries_count}</p>
                      <p className="text-xs text-muted-foreground">Inquiries</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">${selectedPromo.payment_amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Payment</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3 text-center">
                      <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{selectedPromo.duration_months}</p>
                      <p className="text-xs text-muted-foreground">Month(s)</p>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Owner</p>
                    <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{selectedPromo.profile?.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedPromo.profile?.email} · {selectedPromo.profile?.phone || "No phone"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Payment Details</p>
                    <div className="bg-secondary/30 rounded-lg p-3 space-y-1 text-xs">
                      <p>Reference: <span className="font-mono font-bold">{selectedPromo.payment_reference || "N/A"}</span></p>
                      <p>Confirmed: {format(new Date(selectedPromo.payment_confirmed_at), "PPP 'at' p")}</p>
                      <p>Started: {format(new Date(selectedPromo.created_at), "PPP")}</p>
                    </div>
                  </div>

                  {/* Revoke */}
                  {!isExpired && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-sm">Revoke Promotion</Label>
                      <Textarea
                        placeholder="Reason for revoking this promotion..."
                        value={revokeNote}
                        onChange={(e) => setRevokeNote(e.target.value)}
                      />
                      <Button
                        variant="destructive"
                        className="w-full gap-1.5"
                        disabled={revoking || !revokeNote.trim()}
                        onClick={() => handleRevoke(selectedPromo)}
                      >
                        <XCircle className="h-4 w-4" />
                        {revoking ? "Revoking..." : "Revoke Promotion"}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
