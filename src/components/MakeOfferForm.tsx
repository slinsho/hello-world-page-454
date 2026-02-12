import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { USD_TO_LRD_RATE, formatLRD } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HandCoins } from "lucide-react";

interface MakeOfferFormProps {
  propertyId: string;
  propertyTitle: string;
  askingPrice: number;
}

export const MakeOfferForm = ({ propertyId, propertyTitle, askingPrice }: MakeOfferFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    amount: "",
    message: "",
  });

  const offerAmountUsd = parseFloat(form.amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.amount) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("property_offers").insert({
      property_id: propertyId,
      buyer_id: user?.id || null,
      buyer_name: form.name,
      buyer_phone: form.phone,
      offer_amount_usd: offerAmountUsd,
      message: form.message || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Failed to submit offer", variant: "destructive" });
    } else {
      toast({ title: "Offer Sent!", description: "The property owner will review your offer" });
      setOpen(false);
      setForm({ name: "", phone: "", amount: "", message: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 gap-2 rounded-xl bg-primary text-primary-foreground">
          <HandCoins className="h-4 w-4" />
          Make an Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {propertyTitle} · Asking: ${askingPrice.toLocaleString()} ({formatLRD(askingPrice)})
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Your Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div>
            <Label>Phone Number *</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+231..."
            />
          </div>
          <div>
            <Label>Your Offer (USD) *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Enter amount in USD"
            />
            {offerAmountUsd > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatLRD(offerAmountUsd)}
              </p>
            )}
          </div>
          <div>
            <Label>Message (optional)</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Any details about your offer..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Offer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
