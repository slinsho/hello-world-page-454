import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, DollarSign, Bell, Phone, CreditCard } from "lucide-react";

export function AdminRateSettings() {
  const { toast } = useToast();
  const [rate, setRate] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [ownerVerifFee, setOwnerVerifFee] = useState("");
  const [agentVerifFee, setAgentVerifFee] = useState("");
  const [verifDuration, setVerifDuration] = useState("");
  const [lonestarNumber, setLonestarNumber] = useState("");
  const [orangeNumber, setOrangeNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("platform_settings" as any)
        .select("key, value");
      if (data) {
        const map = new Map((data as any[]).map((d: any) => [d.key, d.value]));
        setRate(String(map.get("usd_to_lrd_rate") || "192"));
        setPromoPrice(String(map.get("promotion_price_per_month") || "5"));
        setOwnerVerifFee(String(map.get("owner_verification_fee_lrd") || "500"));
        setAgentVerifFee(String(map.get("agent_verification_fee_usd") || "20"));
        setVerifDuration(String(map.get("verification_duration_days") || "5"));
        const paymentInfo = map.get("payment_info") as any;
        if (paymentInfo) {
          setLonestarNumber(paymentInfo.lonestar || paymentInfo.number || "");
          setOrangeNumber(paymentInfo.orange || "");
          setPaymentName(paymentInfo.name || "");
          setPaymentInstructions(paymentInfo.instructions || "");
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async (notifyUsers: boolean) => {
    const newRate = parseFloat(rate);
    const newPromo = parseFloat(promoPrice);
    if (!newRate || newRate <= 0) {
      toast({ title: "Invalid Rate", description: "Enter a valid exchange rate.", variant: "destructive" });
      return;
    }
    if (!newPromo || newPromo <= 0) {
      toast({ title: "Invalid Price", description: "Enter a valid promotion price.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Update all settings
      await Promise.all([
        supabase.from("platform_settings" as any).update({ value: newRate, updated_at: new Date().toISOString() }).eq("key", "usd_to_lrd_rate"),
        supabase.from("platform_settings" as any).update({ value: newPromo, updated_at: new Date().toISOString() }).eq("key", "promotion_price_per_month"),
        supabase.from("platform_settings" as any).upsert({ key: "owner_verification_fee_lrd", value: parseFloat(ownerVerifFee) || 500, updated_at: new Date().toISOString() } as any),
        supabase.from("platform_settings" as any).upsert({ key: "agent_verification_fee_usd", value: parseFloat(agentVerifFee) || 20, updated_at: new Date().toISOString() } as any),
        supabase.from("platform_settings" as any).upsert({ key: "verification_duration_days", value: parseInt(verifDuration) || 5, updated_at: new Date().toISOString() } as any),
      ]);

      // If verification duration changed, recalculate expires_at for approved verifications
      const newDuration = parseInt(verifDuration) || 5;
      const { data: approvedReqs } = await supabase
        .from("verification_requests")
        .select("id, created_at, processed_at, expires_at")
        .eq("status", "approved");

      if (approvedReqs && approvedReqs.length > 0) {
        for (const req of approvedReqs) {
          const approvedDate = new Date(req.processed_at || req.created_at);
          const newExpiry = new Date(approvedDate.getTime() + newDuration * 24 * 60 * 60 * 1000);
          // Only update if new expiry is different (earlier or later)
          if (!req.expires_at || new Date(req.expires_at).getTime() !== newExpiry.getTime()) {
            await supabase
              .from("verification_requests")
              .update({ expires_at: newExpiry.toISOString() } as any)
              .eq("id", req.id);
          }
        }
        // Trigger the expiry check edge function to process any newly-expired verifications
        try {
          await supabase.functions.invoke("check-verification-expiry");
        } catch (e) {
          console.warn("Could not trigger expiry check:", e);
        }
      }

      if (notifyUsers) {
        // Fetch all user IDs to notify
        const { data: profiles } = await supabase.from("profiles").select("id");
        if (profiles && profiles.length > 0) {
          const messages: string[] = [];
          messages.push(`Exchange rate: $1 = L$${newRate.toLocaleString()}`);
          messages.push(`Verification duration: ${newDuration} day${newDuration !== 1 ? 's' : ''}`);
          messages.push(`Owner verification fee: L$${(parseFloat(ownerVerifFee) || 500).toLocaleString()}`);
          messages.push(`Agent verification fee: $${parseFloat(agentVerifFee) || 20}`);
          messages.push(`Promotion price: $${newPromo}/month`);

          const notifications = profiles.map((p) => ({
            user_id: p.id,
            title: "Platform Settings Updated",
            message: `The admin has updated platform settings:\n${messages.join('\n')}\nPlease review if this affects your account.`,
            type: "status_updates",
          }));
          // Insert in batches of 100
          for (let i = 0; i < notifications.length; i += 100) {
            await supabase.from("notifications").insert(notifications.slice(i, i + 100));
          }
        }
      }

      toast({ title: "Settings Saved", description: notifyUsers ? "Settings updated and all users notified." : "Settings updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentInfo = async () => {
    if (!lonestarNumber.trim() && !orangeNumber.trim()) {
      toast({ title: "Missing Number", description: "Please enter at least one payment number.", variant: "destructive" });
      return;
    }
    setSavingPayment(true);
    try {
      const paymentInfo = { lonestar: lonestarNumber.trim(), orange: orangeNumber.trim(), name: paymentName.trim(), instructions: paymentInstructions.trim() };
      const { data: existing } = await supabase.from("platform_settings" as any).select("key").eq("key", "payment_info").single();
      if (existing) {
        await supabase.from("platform_settings" as any).update({ value: paymentInfo, updated_at: new Date().toISOString() }).eq("key", "payment_info");
      } else {
        await supabase.from("platform_settings" as any).insert({ key: "payment_info", value: paymentInfo } as any);
      }
      toast({ title: "Payment Info Saved", description: "Users will now see this payment number in their payment notifications." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Loading settings...</p></CardContent></Card>;
  }

  const previewLrd = parseFloat(rate) || 0;

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            Exchange Rate & Promotion Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exchange Rate */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">USD to LRD Exchange Rate</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground">$1 =</span>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="192"
                  className="max-w-[140px]"
                />
                <span className="text-sm text-muted-foreground">LRD</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Preview: $100 = L${(100 * previewLrd).toLocaleString()} | $1,000 = L${(1000 * previewLrd).toLocaleString()}
            </p>
          </div>

          {/* Promotion Price */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Promotion Price Per Month (USD)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="5"
                className="max-w-[140px]"
              />
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Preview: 1 month = ${parseFloat(promoPrice) || 0} (L${((parseFloat(promoPrice) || 0) * previewLrd).toLocaleString()}) | 
              3 months = ${(parseFloat(promoPrice) || 0) * 3} | 
              12 months = ${(parseFloat(promoPrice) || 0) * 12}
            </p>
          </div>

          {/* Verification Fees */}
          <div className="space-y-4 border-t border-border pt-4">
            <Label className="text-sm font-semibold">Verification Fees</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Owner Fee (LRD)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">L$</span>
                  <Input type="number" value={ownerVerifFee} onChange={(e) => setOwnerVerifFee(e.target.value)} placeholder="500" className="max-w-[120px]" />
                </div>
                <p className="text-[10px] text-muted-foreground">≈ ${((parseFloat(ownerVerifFee) || 500) / previewLrd).toFixed(2)} USD</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Agent Fee (USD)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input type="number" value={agentVerifFee} onChange={(e) => setAgentVerifFee(e.target.value)} placeholder="20" className="max-w-[120px]" />
                </div>
                <p className="text-[10px] text-muted-foreground">≈ L${((parseFloat(agentVerifFee) || 20) * previewLrd).toLocaleString()}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Duration (Days)</Label>
                <Input type="number" value={verifDuration} onChange={(e) => setVerifDuration(e.target.value)} placeholder="5" className="max-w-[120px]" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="flex-1 gap-1.5">
              <RefreshCw className="h-4 w-4" />
              {saving ? "Saving..." : "Save Only"}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="flex-1 gap-1.5">
              <Bell className="h-4 w-4" />
              {saving ? "Saving..." : "Save & Notify All Users"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Number Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" />
            Payment Number / Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            This payment number will be shown to users when they need to make a payment for promotions. Users will see it automatically in their payment notification.
          </p>
           <div className="space-y-2">
            <Label className="text-sm font-medium">Account / Business Name</Label>
            <Input
              value={paymentName}
              onChange={(e) => setPaymentName(e.target.value)}
              placeholder="e.g. LibbProperty Mobile Money"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Lonestar (MTN) Number</Label>
            <Input
              value={lonestarNumber}
              onChange={(e) => setLonestarNumber(e.target.value)}
              placeholder="e.g. 0886000000"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Orange Number</Label>
            <Input
              value={orangeNumber}
              onChange={(e) => setOrangeNumber(e.target.value)}
              placeholder="e.g. 0770000000"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Instructions (optional)</Label>
            <Textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="e.g. Send payment via Orange Money to the number above. Include your property title as reference."
              maxLength={300}
              rows={3}
            />
          </div>
          <Button onClick={handleSavePaymentInfo} disabled={savingPayment} className="w-full gap-1.5">
            <CreditCard className="h-4 w-4" />
            {savingPayment ? "Saving..." : "Save Payment Info"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
