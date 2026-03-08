import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";

interface PromotionRequest {
  id: string;
  property_id: string;
  user_id: string;
  reason: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  property?: { title: string; county: string; price_usd: number; photos: string[] } | null;
  profile?: { name: string; email: string; role: string } | null;
}

export function AdminPromotions() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("promotion_requests" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) return;

    // Enrich with property and profile data
    const propertyIds = [...new Set(data.map((r: any) => r.property_id))];
    const userIds = [...new Set(data.map((r: any) => r.user_id))];

    const [{ data: properties }, { data: profiles }] = await Promise.all([
      supabase.from("properties").select("id, title, county, price_usd, photos").in("id", propertyIds),
      supabase.from("profiles").select("id, name, email, role").in("id", userIds),
    ]);

    const propMap = new Map(properties?.map((p) => [p.id, p]));
    const profMap = new Map(profiles?.map((p) => [p.id, p]));

    const enriched = data.map((r: any) => ({
      ...r,
      property: propMap.get(r.property_id) || null,
      profile: profMap.get(r.user_id) || null,
    }));

    setRequests(enriched);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (requestId: string, propertyId: string, action: "approve" | "reject") => {
    if (action === "reject" && !notes[requestId]) {
      toast({ title: "Note Required", description: "Please provide a reason for rejection", variant: "destructive" });
      return;
    }

    try {
      // Update promotion request
      const { error: reqError } = await supabase
        .from("promotion_requests" as any)
        .update({
          status: action === "approve" ? "approved" : "rejected",
          admin_note: notes[requestId] || null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (reqError) throw reqError;

      // If approved, mark property as promoted
      if (action === "approve") {
        await supabase
          .from("properties")
          .update({ is_promoted: true } as any)
          .eq("id", propertyId);
      }

      toast({ title: "Success", description: `Promotion request ${action === "approve" ? "approved" : "rejected"}` });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to process request", variant: "destructive" });
    }
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
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {req.property?.title || "Unknown Property"}
                </CardTitle>
                <Badge variant="secondary">pending</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Requested by: {req.profile?.name || "Unknown"} ({req.profile?.role || "unknown"}) · {format(new Date(req.created_at), "PPp")}
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

              {req.reason && (
                <div>
                  <p className="text-sm font-medium mb-1">Reason</p>
                  <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">{req.reason}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Admin Note</p>
                <Textarea
                  placeholder="Add a note (optional for approval, required for rejection)"
                  value={notes[req.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [req.id]: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={() => handleAction(req.id, req.property_id, "approve")} className="flex-1">
                  Approve & Feature
                </Button>
                <Button onClick={() => handleAction(req.id, req.property_id, "reject")} variant="destructive" className="flex-1">
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
