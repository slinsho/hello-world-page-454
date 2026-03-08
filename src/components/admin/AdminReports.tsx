import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Flag, AlertTriangle } from "lucide-react";

interface PropertyReport {
  id: string;
  property_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  property?: { title: string; county: string; price_usd: number; photos: string[]; owner_id: string } | null;
  reporter?: { name: string; email: string } | null;
  owner?: { name: string } | null;
}

export function AdminReports() {
  const [reports, setReports] = useState<PropertyReport[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("property_reports" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) return;

    const propertyIds = [...new Set(data.map((r: any) => r.property_id))];
    const reporterIds = [...new Set(data.map((r: any) => r.reporter_id))];

    const [{ data: properties }, { data: reporters }] = await Promise.all([
      supabase.from("properties").select("id, title, county, price_usd, photos, owner_id").in("id", propertyIds),
      supabase.from("profiles").select("id, name, email").in("id", reporterIds),
    ]);

    const propMap = new Map(properties?.map((p) => [p.id, p]));
    const reporterMap = new Map(reporters?.map((p) => [p.id, p]));

    // Get owner names
    const ownerIds = [...new Set(properties?.map((p) => p.owner_id) || [])];
    const { data: owners } = await supabase.from("profiles").select("id, name").in("id", ownerIds);
    const ownerMap = new Map(owners?.map((o) => [o.id, o]));

    const enriched = data.map((r: any) => {
      const prop = propMap.get(r.property_id);
      return {
        ...r,
        property: prop || null,
        reporter: reporterMap.get(r.reporter_id) || null,
        owner: prop ? ownerMap.get(prop.owner_id) || null : null,
      };
    });

    setReports(enriched);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleAction = async (reportId: string, propertyId: string, ownerId: string, action: "flag" | "dismiss") => {
    try {
      // Update report status
      const { error: repError } = await supabase
        .from("property_reports" as any)
        .update({
          status: action === "flag" ? "flagged" : "dismissed",
          admin_note: notes[reportId] || null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (repError) throw repError;

      if (action === "flag") {
        // Flag the property
        await supabase
          .from("properties")
          .update({ is_flagged: true } as any)
          .eq("id", propertyId);

        // Notify the property owner
        await supabase.from("notifications").insert([{
          user_id: ownerId,
          property_id: propertyId,
          title: "Property Flagged",
          message: `Your property has been flagged for review. Reason: ${notes[reportId] || "Reported by users"}. Please ensure your listing is accurate.`,
          type: "status_updates",
        }]);
      }

      toast({ title: "Success", description: action === "flag" ? "Property flagged and owner notified" : "Report dismissed" });
      fetchReports();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to process report", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No pending property reports</p>
          </CardContent>
        </Card>
      ) : (
        reports.map((report) => (
          <Card key={report.id} className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {report.property?.title || "Unknown Property"}
                </CardTitle>
                <Badge variant="destructive" className="text-xs">Reported</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Reported by: {report.reporter?.name || "Unknown"} · {format(new Date(report.created_at), "PPp")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property preview */}
              <div className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                {report.property?.photos?.[0] && (
                  <img src={report.property.photos[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{report.property?.title}</p>
                  <p className="text-xs text-muted-foreground">{report.property?.county} · ${report.property?.price_usd?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Owner: {report.owner?.name || "Unknown"}</p>
                </div>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm font-medium text-destructive mb-1">Report Reason</p>
                <p className="text-sm">{report.reason}</p>
                {report.details && <p className="text-sm text-muted-foreground mt-1">{report.details}</p>}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Admin Note</p>
                <Textarea
                  placeholder="Add a note (sent to owner if flagged)"
                  value={notes[report.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [report.id]: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => handleAction(report.id, report.property_id, report.property?.owner_id || "", "flag")}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <Flag className="h-4 w-4" />Flag & Notify Owner
                </Button>
                <Button
                  onClick={() => handleAction(report.id, report.property_id, report.property?.owner_id || "", "dismiss")}
                  variant="outline"
                  className="flex-1"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
