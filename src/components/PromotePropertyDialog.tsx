import { useState } from "react";
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
import { Megaphone, Sparkles } from "lucide-react";

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

  if (!isOwner) return null;

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("promotion_requests" as any).insert([{
        property_id: propertyId,
        user_id: user.id,
        reason: reason.trim() || null,
      }]);
      if (error) throw error;

      toast({ title: "Request Submitted", description: "Your promotion request has been sent to admin for review." });
      setOpen(false);
      setReason("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit request", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
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
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">
            Request to feature <span className="font-medium text-foreground">"{propertyTitle}"</span> at the top of listings. Our admin team will review your request.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-primary">What you get:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✦ Featured badge on your listing</li>
              <li>✦ Priority placement in search results</li>
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
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl gap-2"
          >
            {submitting ? "Submitting..." : <>
              <Megaphone className="h-4 w-4" />Submit Promotion Request
            </>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
