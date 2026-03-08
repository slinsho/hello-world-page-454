import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Megaphone, Sparkles, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromotePropertyDialogProps {
  propertyId: string;
  propertyTitle: string;
  isOwner: boolean;
}

export function PromotePropertyDialog({ propertyId, propertyTitle, isOwner }: PromotePropertyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);

  const fetchExistingRequest = async () => {
    if (!user) return;
    setLoadingRequest(true);
    const { data } = await supabase
      .from("promotion_requests")
      .select("*")
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) setExistingRequest(data[0]);
    setLoadingRequest(false);
  };

  useEffect(() => {
    if (open) fetchExistingRequest();
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("promotion_requests").insert([{
        property_id: propertyId,
        user_id: user.id,
        reason: reason.trim() || null,
      }]);
      if (error) throw error;
      toast({ title: "Request Submitted", description: "Your promotion request has been sent to admin for review." });
      setOpen(false);
      setReason("");
      setExistingRequest(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit request", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!existingRequest) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("promotion_requests")
        .update({ payment_status: "paid" } as any)
        .eq("id", existingRequest.id);
      if (error) throw error;
      toast({ title: "Payment Confirmed", description: "Admin will review and activate your promotion shortly." });
      fetchExistingRequest();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loadingRequest) {
      return <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>;
    }

    // Has existing request with payment requested
    if (existingRequest && existingRequest.status === "approved" && existingRequest.payment_status === "requested") {
      return (
        <div className="space-y-4 py-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <p className="font-semibold text-amber-800">Payment Required</p>
            </div>
            <p className="text-sm text-amber-700">
              Your promotion request has been approved! Please pay <span className="font-bold">${(existingRequest.payment_amount || 0).toLocaleString()}</span> to activate your featured listing.
            </p>
            {existingRequest.admin_note && (
              <p className="text-xs text-amber-600 italic">Admin note: {existingRequest.admin_note}</p>
            )}
          </div>
          <Button onClick={handleConfirmPayment} disabled={submitting} className="w-full rounded-xl gap-2">
            {submitting ? "Confirming..." : <><CheckCircle2 className="h-4 w-4" /> I've Made the Payment</>}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">After confirming, admin will verify and promote your listing.</p>
        </div>
      );
    }

    // Has existing pending request
    if (existingRequest && existingRequest.status === "pending") {
      return (
        <div className="space-y-4 py-2">
          <div className="bg-secondary/50 rounded-xl p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Request Pending</p>
              <p className="text-xs text-muted-foreground">Your promotion request is being reviewed by admin.</p>
            </div>
          </div>
        </div>
      );
    }

    // Already paid, waiting for admin confirmation
    if (existingRequest && existingRequest.payment_status === "paid") {
      return (
        <div className="space-y-4 py-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Payment Submitted</p>
              <p className="text-xs text-green-600">Admin is verifying your payment. Your listing will be promoted shortly.</p>
            </div>
          </div>
        </div>
      );
    }

    // New request form
    return (
      <div className="space-y-4 py-2">
        <p className="text-xs text-muted-foreground">
          Request to feature <span className="font-medium text-foreground">"{propertyTitle}"</span> at the top of listings. Our admin team will review and send you a payment request.
        </p>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-primary">What you get:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✦ Featured badge on your listing</li>
            <li>✦ Floating banner on profile, near me & news pages</li>
            <li>✦ Dedicated featured listings page</li>
            <li>✦ Higher visibility to buyers</li>
          </ul>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Why should this property be featured? (optional)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Recently renovated, great location..."
            rows={3}
            className="rounded-xl resize-none"
            maxLength={300}
          />
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-xl gap-2">
          {submitting ? "Submitting..." : <><Megaphone className="h-4 w-4" />Submit Promotion Request</>}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs border-primary/30 text-primary hover:bg-primary/10">
          <Megaphone className="h-3.5 w-3.5" />Promote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Promote Property
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
