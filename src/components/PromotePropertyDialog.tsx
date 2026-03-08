import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Megaphone, Sparkles, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { usePlatformSettings, formatLRDDynamic } from "@/hooks/usePlatformSettings";

interface PromotePropertyDialogProps {
  propertyId: string;
  propertyTitle: string;
  isOwner: boolean;
}

const DURATION_OPTIONS = [
  { value: "1", label: "1 Month" },
  { value: "2", label: "2 Months" },
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" },
];

export function PromotePropertyDialog({ propertyId, propertyTitle, isOwner }: PromotePropertyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = usePlatformSettings();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [durationMonths, setDurationMonths] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");

  const totalUsd = settings.promotion_price_per_month * parseInt(durationMonths);
  const totalLrd = formatLRDDynamic(totalUsd, settings.usd_to_lrd_rate);

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
    if (open && isOwner) fetchExistingRequest();
  }, [open, isOwner]);

  if (!isOwner) return null;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("promotion_requests").insert([{
        property_id: propertyId,
        user_id: user.id,
        reason: reason.trim() || null,
        duration_months: parseInt(durationMonths),
        payment_amount: totalUsd,
      } as any]);
      if (error) throw error;
      toast({ title: "Request Submitted", description: "Your promotion request has been sent to admin for review." });
      setOpen(false);
      setReason("");
      setDurationMonths("1");
      setExistingRequest(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit request", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!existingRequest) return;
    const trimmedRef = paymentRef.trim();
    if (!trimmedRef) {
      toast({ title: "Reference Required", description: "Please enter your transaction reference number.", variant: "destructive" });
      return;
    }
    if (trimmedRef.length < 4 || trimmedRef.length > 100) {
      toast({ title: "Invalid Reference", description: "Reference must be between 4 and 100 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("promotion_requests")
        .update({ payment_status: "paid", payment_reference: trimmedRef } as any)
        .eq("id", existingRequest.id);
      if (error) throw error;
      toast({ title: "Payment Confirmed", description: "Admin will review and activate your promotion shortly." });
      setPaymentRef("");
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

    // Payment requested
    if (existingRequest && existingRequest.status === "approved" && existingRequest.payment_status === "requested") {
      const reqAmount = existingRequest.payment_amount || 0;
      return (
        <div className="space-y-4 py-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <p className="font-semibold text-amber-800">Payment Required</p>
            </div>
            <p className="text-sm text-amber-700">
              Your promotion request has been approved! Please pay:
            </p>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-amber-900">${reqAmount.toLocaleString()}</p>
              <p className="text-xs text-amber-600">{formatLRDDynamic(reqAmount, settings.usd_to_lrd_rate)}</p>
              <p className="text-[10px] text-amber-500">{existingRequest.duration_months || 1} month(s)</p>
            </div>
            {existingRequest.admin_note && (
              <p className="text-xs text-amber-600 italic">Admin note: {existingRequest.admin_note}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Transaction Reference Number</Label>
            <Input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. TXN-20260308-12345"
              maxLength={100}
              className="rounded-xl"
            />
          </div>
          <Button onClick={handleConfirmPayment} disabled={submitting || !paymentRef.trim()} className="w-full rounded-xl gap-2">
            {submitting ? "Confirming..." : <><CheckCircle2 className="h-4 w-4" /> I've Made the Payment</>}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">After confirming, admin will verify your payment reference and promote your listing.</p>
        </div>
      );
    }

    // Pending
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

    // Paid, waiting confirmation
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

    // New request form with duration picker
    return (
      <div className="space-y-4 py-2">
        <p className="text-xs text-muted-foreground">
          Request to feature <span className="font-medium text-foreground">"{propertyTitle}"</span> at the top of listings.
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

        {/* Duration picker */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Promotion Duration</Label>
          <Select value={durationMonths} onValueChange={setDurationMonths}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price display */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center space-y-0.5">
          <p className="text-xs text-muted-foreground">${settings.promotion_price_per_month}/month × {durationMonths} month(s)</p>
          <p className="text-xl font-bold text-foreground">${totalUsd.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{totalLrd}</p>
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
          {submitting ? "Submitting..." : <><Megaphone className="h-4 w-4" />Submit Promotion Request — ${totalUsd}</>}
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
