import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Megaphone, DollarSign, CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface PromotionRequest {
  id: string;
  property_id: string;
  user_id: string;
  reason: string | null;
  status: string;
  admin_note: string | null;
  payment_amount: number | null;
  payment_status: string;
  created_at: string;
  property?: { title: string; county: string; price_usd: number; photos: string[] } | null;
  profile?: { name: string; email: string; role: string } | null;
}

export function AdminPromotions() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("promotion_requests")
      .select("*")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false });

    if (error || !data) return;

    const propertyIds = [...new Set(data.map((r: any) => r.property_id))];
    const userIds = [...new Set(data.map((r: any) => r.user_id))];

    const [{ data: properties }, { data: profiles }] = await Promise.all([
      supabase.from("properties").select("id, title, county, price_usd, photos").in("id", propertyIds.length ? propertyIds : ["_"]),
      supabase.from("profiles").select("id, name, email, role").in("id", userIds.length ? userIds : ["_"]),
    ]);

    const propMap = new Map(properties?.map((p) => [p.id, p]));
    const profMap = new Map(profiles?.map((p) => [p.id, p]));

    setRequests(data.map((r: any) => ({
      ...r,
      property: propMap.get(r.property_id) || null,
      profile: profMap.get(r.user_id) || null,
    })));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSendPaymentRequest = async (requestId: string) => {
    const amount = parseFloat(amounts[requestId] || "0");
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid payment amount", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("promotion_requests")
        .update({
          status: "approved",
          payment_amount: amount,
          payment_status: "requested",
          payment_requested_at: new Date().toISOString(),
          admin_note: notes[requestId] || null,
        } as any)
        .eq("id", requestId);

      if (error) throw error;

      // Notify user about payment request
      const req = requests.find(r => r.id === requestId);
      if (req) {
        await supabase.from("notifications").insert({
          user_id: req.user_id,
          property_id: req.property_id,
          title: "🎉 Promotion Qualified — Payment Required",
          message: `Your promotion request for "${req.property?.title}" has been qualified! Please pay $${amount.toLocaleString()} to activate your featured listing. Go to the property page and click "Promote" to submit your payment reference.`,
        });
      }

      toast({ title: "Payment Request Sent", description: "User has been notified about the payment." });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleConfirmPaymentAndPromote = async (requestId: string, propertyId: string) => {
    try {
      const { error: reqErr } = await supabase
        .from("promotion_requests")
        .update({
          payment_status: "confirmed",
          payment_confirmed_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        } as any)
        .eq("id", requestId);
      if (reqErr) throw reqErr;

      await supabase
        .from("properties")
        .update({ is_promoted: true })
        .eq("id", propertyId);

      const req = requests.find(r => r.id === requestId);
      if (req) {
        await supabase.from("notifications").insert({
          user_id: req.user_id,
          property_id: req.property_id,
          title: "Property Promoted! 🎉",
          message: `Your property "${req.property?.title}" is now featured and will appear at the top of listings.`,
        });
      }

      toast({ title: "Property Promoted!", description: "The property is now featured." });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (requestId: string) => {
    if (!notes[requestId]) {
      toast({ title: "Note Required", description: "Please provide a reason for rejection", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from("promotion_requests")
        .update({
          status: "rejected",
          admin_note: notes[requestId],
          processed_at: new Date().toISOString(),
        } as any)
        .eq("id", requestId);
      if (error) throw error;

      const req = requests.find(r => r.id === requestId);
      if (req) {
        await supabase.from("notifications").insert({
          user_id: req.user_id,
          property_id: req.property_id,
          title: "Promotion Request Rejected",
          message: `Your promotion request for "${req.property?.title}" was rejected. Reason: ${notes[requestId]}`,
        });
      }

      toast({ title: "Rejected", description: "Promotion request rejected." });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("promotion_requests")
        .delete()
        .eq("id", requestId);
      if (error) throw error;
      toast({ title: "Deleted", description: "Promotion request deleted." });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (req: PromotionRequest) => {
    if (req.status === "approved" && req.payment_status === "requested") return <Badge variant="outline" className="text-amber-600 border-amber-300">Awaiting Payment</Badge>;
    if (req.status === "approved" && req.payment_status === "paid") return <Badge className="bg-green-100 text-green-700 border-green-300">Payment Received</Badge>;
    return <Badge variant="secondary">Pending Review</Badge>;
  };

  return (
    <div className="space-y-6 mt-6">
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No pending promotion requests</p>
          </CardContent>
        </Card>
      ) : (
        requests.map((req) => (
          <Card key={req.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {req.property?.title || "Unknown Property"}
                </CardTitle>
                {getStatusBadge(req)}
              </div>
              <p className="text-sm text-muted-foreground">
                By: {req.profile?.name || "Unknown"} ({req.profile?.role}) · {format(new Date(req.created_at), "PPp")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property preview */}
              <div className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                {req.property?.photos?.[0] && (
                  <img src={req.property.photos[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{req.property?.title}</p>
                  <p className="text-xs text-muted-foreground">{req.property?.county} · ${req.property?.price_usd?.toLocaleString()}</p>
                </div>
              </div>

              {/* Duration & Amount info */}
              <div className="flex gap-3 text-xs">
                <span className="bg-secondary/50 px-2 py-1 rounded">Duration: {(req as any).duration_months || 1} month(s)</span>
                {req.payment_amount && <span className="bg-secondary/50 px-2 py-1 rounded">Amount: ${req.payment_amount.toLocaleString()}</span>}
              </div>

              {req.reason && (
                <div>
                  <p className="text-sm font-medium mb-1">Reason</p>
                  <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">{req.reason}</p>
                </div>
              )}

              {/* Admin actions based on state */}
              {req.status === "pending" && (
                <>
                  <div>
                    <Label className="text-sm">Admin Note</Label>
                    <Textarea
                      placeholder="Add a note (optional for payment request, required for rejection)"
                      value={notes[req.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [req.id]: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Payment Amount (USD)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 25"
                      value={amounts[req.id] || ""}
                      onChange={(e) => setAmounts({ ...amounts, [req.id]: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleSendPaymentRequest(req.id)} className="flex-1 gap-1.5">
                      <DollarSign className="h-4 w-4" /> Send Payment Request
                    </Button>
                    <Button onClick={() => handleReject(req.id)} variant="destructive" className="flex-1 gap-1.5">
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </>
              )}

              {req.status === "approved" && req.payment_status === "paid" && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                    <p className="text-sm text-green-700 font-medium">User confirmed payment of ${(req.payment_amount || 0).toLocaleString()}</p>
                    {(req as any).payment_reference && (
                      <p className="text-xs text-green-600">Transaction Ref: <span className="font-mono font-bold">{(req as any).payment_reference}</span></p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleConfirmPaymentAndPromote(req.id, req.property_id)} className="flex-1 gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Confirm & Promote
                    </Button>
                    <Button onClick={() => handleReject(req.id)} variant="destructive" className="flex-1 gap-1.5">
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              {req.status === "approved" && req.payment_status === "requested" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700">Waiting for user to pay ${(req.payment_amount || 0).toLocaleString()}</p>
                </div>
              )}

              {/* Delete button */}
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5" onClick={() => handleDelete(req.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
