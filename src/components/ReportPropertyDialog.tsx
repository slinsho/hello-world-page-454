import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Flag } from "lucide-react";

interface ReportPropertyDialogProps {
  propertyId: string;
  propertyTitle: string;
}

const REPORT_REASONS = [
  "Fake or misleading listing",
  "Incorrect price or details",
  "Property already sold/rented",
  "Scam or fraud",
  "Duplicate listing",
  "Inappropriate content",
  "Other",
];

export function ReportPropertyDialog({ propertyId, propertyTitle }: ReportPropertyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to report a property", variant: "destructive" });
      return;
    }
    if (!reason) {
      toast({ title: "Reason Required", description: "Please select a reason for reporting", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("property_reports" as any).insert([{
        property_id: propertyId,
        reporter_id: user.id,
        reason,
        details: details.trim() || null,
      }]);
      if (error) throw error;
      // Notify admins
      await notifyAdmins({
        title: "New Property Report",
        message: `A property has been reported for: ${reason}.`,
        type: "status_updates",
        propertyId,
      });
      toast({ title: "Report Submitted", description: "Thank you. Our team will review this property." });
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit report", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-full text-xs">
          <Flag className="h-3.5 w-3.5" />Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Report Property</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">Reporting: <span className="font-medium text-foreground">{propertyTitle}</span></p>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Additional Details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more information about the issue..."
              rows={3}
              className="rounded-xl resize-none"
              maxLength={500}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="w-full rounded-xl"
            variant="destructive"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
