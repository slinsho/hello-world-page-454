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
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("platform_settings" as any)
        .select("key, value");
      if (data) {
        const map = new Map((data as any[]).map((d: any) => [d.key, d.value]));
        setRate(String(map.get("usd_to_lrd_rate") || "192"));
        setPromoPrice(String(map.get("promotion_price_per_month") || "5"));
        const paymentInfo = map.get("payment_info") as any;
        if (paymentInfo) {
          setPaymentNumber(paymentInfo.number || "");
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
      ]);

      if (notifyUsers) {
        // Fetch all user IDs to notify
        const { data: profiles } = await supabase.from("profiles").select("id");
        if (profiles && profiles.length > 0) {
          const notifications = profiles.map((p) => ({
            user_id: p.id,
            title: "Exchange Rate Updated",
            message: `The USD to LRD exchange rate has been updated to L$${newRate.toLocaleString()}. All property prices now reflect the new rate.`,
          }));
          // Insert in batches of 100
          for (let i = 0; i < notifications.length; i += 100) {
            await supabase.from("notifications").insert(notifications.slice(i, i + 100));
          }
        }
      }

      toast({ title: "Settings Saved", description: notifyUsers ? "Rate updated and all users notified." : "Rate updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
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
            <Label className="text-sm font-medium">Payment Number</Label>
            <Input
              value={paymentNumber}
              onChange={(e) => setPaymentNumber(e.target.value)}
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
