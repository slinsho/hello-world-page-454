import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = { location: "Location Check ($10)", legal: "Legal Docs ($80)", help_buy: "Help Me Buy (0.4%)" };

const AdminInspections = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("property_inspections") as any).select("*, properties(title, price_usd, county)").order("created_at", { ascending: false });
    setItems((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, status: string, note?: string) => {
    const { error } = await (supabase.from("property_inspections") as any).update({ status, admin_notes: note ?? null }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated" });
    load();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold">Inspection Requests</h2>
      {items.length === 0 && <p className="text-muted-foreground">No inspection requests yet.</p>}
      {items.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.properties?.title || "Property"}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[r.inspection_type] || r.inspection_type} · Fee ${Number(r.fee_usd).toFixed(2)}</p>
              </div>
              <Badge variant={r.status === "completed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}>{r.status}</Badge>
            </div>
            <div className="text-sm">
              <p>{r.requester_name} · {r.requester_phone} {r.requester_email ? `· ${r.requester_email}` : ""}</p>
              {r.form_data?.preferred_date && <p className="text-xs text-muted-foreground">Preferred: {r.form_data.preferred_date}</p>}
              {r.form_data?.budget_usd && <p className="text-xs text-muted-foreground">Budget: ${r.form_data.budget_usd}</p>}
              {r.form_data?.notes && <p className="text-xs italic text-muted-foreground">"{r.form_data.notes}"</p>}
              {r.payment_reference && <p className="text-xs">Payment Ref: {r.payment_reference}</p>}
            </div>
            <Textarea placeholder="Admin notes..." defaultValue={r.admin_notes || ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} className="text-sm" />
            <div className="flex gap-2 flex-wrap">
              <Select onValueChange={(v) => update(r.id, v, notes[r.id] ?? r.admin_notes)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Update status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => update(r.id, r.status, notes[r.id] ?? "")}>Save Notes</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminInspections;
