import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserCog, FileUp, ClipboardCheck } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  location: "Location Check ($10)",
  legal: "Legal Docs ($80)",
  help_buy: "Help Me Buy (0.4%)",
};

const AdminInspections = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ name: "", phone: "" });
  const [reportForm, setReportForm] = useState<{ notes: string; photos: string[]; report_url: string; video_url: string }>({
    notes: "",
    photos: [],
    report_url: "",
    video_url: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("property_inspections") as any)
      .select("*, properties(title, price_usd, county)")
      .order("created_at", { ascending: false });
    setItems((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const { error } = await (supabase.from("property_inspections") as any).update(patch).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return false; }
    toast({ title: "Updated" });
    load();
    return true;
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const path = `inspections/${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("property-photos").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    return supabase.storage.from("property-photos").getPublicUrl(path).data.publicUrl;
  };

  const submitAssign = async () => {
    if (!assignOpen) return;
    if (!assignForm.name) { toast({ title: "Inspector name required", variant: "destructive" }); return; }
    const ok = await update(assignOpen, {
      status: "assigned",
      inspector_name: assignForm.name,
      inspector_phone: assignForm.phone || null,
      assigned_at: new Date().toISOString(),
    });
    if (ok) {
      const req = items.find((x) => x.id === assignOpen);
      if (req?.requester_id) {
        await supabase.from("notifications").insert({
          user_id: req.requester_id,
          title: "Inspector Assigned",
          message: `${assignForm.name} has been assigned to your inspection request.`,
          type: "status_updates",
          property_id: req.property_id,
        });
      }
      setAssignOpen(null);
      setAssignForm({ name: "", phone: "" });
    }
  };

  const submitReport = async () => {
    if (!reportOpen) return;
    const ok = await update(reportOpen, {
      status: "completed",
      report_notes: reportForm.notes || null,
      report_photos: reportForm.photos,
      report_url: reportForm.report_url || null,
      report_video_url: reportForm.video_url || null,
      completed_at: new Date().toISOString(),
    });
    if (ok) {
      const req = items.find((x) => x.id === reportOpen);
      if (req?.requester_id) {
        await supabase.from("notifications").insert({
          user_id: req.requester_id,
          title: "Inspection Report Ready",
          message: `Your ${TYPE_LABELS[req.inspection_type] || "inspection"} report is now available.`,
          type: "status_updates",
          property_id: req.property_id,
        });
      }
      setReportOpen(null);
      setReportForm({ notes: "", photos: [], report_url: "", video_url: "" });
    }
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
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[r.inspection_type] || r.inspection_type} · Fee ${Number(r.fee_usd).toFixed(2)}
                </p>
              </div>
              <Badge
                variant={
                  r.status === "completed" ? "default" :
                  r.status === "cancelled" ? "destructive" :
                  r.status === "assigned" || r.status === "in_progress" ? "secondary" : "outline"
                }
              >
                {r.status}
              </Badge>
            </div>
            <div className="text-sm">
              <p>{r.requester_name} · {r.requester_phone} {r.requester_email ? `· ${r.requester_email}` : ""}</p>
              {r.form_data?.preferred_date && <p className="text-xs text-muted-foreground">Preferred: {r.form_data.preferred_date}</p>}
              {r.form_data?.budget_usd && <p className="text-xs text-muted-foreground">Budget: ${r.form_data.budget_usd}</p>}
              {r.form_data?.notes && <p className="text-xs italic text-muted-foreground">"{r.form_data.notes}"</p>}
              {r.payment_reference && <p className="text-xs">Payment Ref: {r.payment_reference}</p>}
              {r.inspector_name && <p className="text-xs mt-1"><span className="font-semibold">Inspector:</span> {r.inspector_name} {r.inspector_phone ? `· ${r.inspector_phone}` : ""}</p>}
              {r.report_notes && <p className="text-xs mt-1 p-2 bg-muted rounded"><span className="font-semibold">Report:</span> {r.report_notes}</p>}
              {(r.report_photos?.length || r.report_url || r.report_video_url) && (
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  {r.report_photos?.map((u: string, i: number) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="underline text-primary">Photo {i + 1}</a>
                  ))}
                  {r.report_url && <a href={r.report_url} target="_blank" rel="noreferrer" className="underline text-primary">Report File</a>}
                  {r.report_video_url && <a href={r.report_video_url} target="_blank" rel="noreferrer" className="underline text-primary">Video</a>}
                </div>
              )}
            </div>
            <Textarea
              placeholder="Admin notes..."
              defaultValue={r.admin_notes || ""}
              onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
              className="text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              <Select onValueChange={(v) => update(r.id, { status: v, admin_notes: notes[r.id] ?? r.admin_notes })}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Update status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => update(r.id, { admin_notes: notes[r.id] ?? "" })}>
                Save Notes
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setAssignOpen(r.id); setAssignForm({ name: r.inspector_name || "", phone: r.inspector_phone || "" }); }}>
                <UserCog className="w-4 h-4 mr-1" />Assign Inspector
              </Button>
              <Button size="sm" onClick={() => { setReportOpen(r.id); setReportForm({ notes: r.report_notes || "", photos: r.report_photos || [], report_url: r.report_url || "", video_url: r.report_video_url || "" }); }}>
                <ClipboardCheck className="w-4 h-4 mr-1" />Upload Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Assign inspector dialog */}
      <Dialog open={!!assignOpen} onOpenChange={(o) => !o && setAssignOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Inspector</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Inspector name *" value={assignForm.name} onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })} />
            <Input placeholder="Inspector phone" value={assignForm.phone} onChange={(e) => setAssignForm({ ...assignForm, phone: e.target.value })} />
            <Button onClick={submitAssign} className="w-full">Assign & Notify Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload report dialog */}
      <Dialog open={!!reportOpen} onOpenChange={(o) => !o && setReportOpen(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Upload Inspection Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea placeholder="Inspection summary / findings" value={reportForm.notes} onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })} rows={5} />

            <div>
              <label className="text-xs font-medium">Report photos</label>
              <Input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const urls: string[] = [];
                for (const f of files) {
                  const u = await uploadFile(f, "photos");
                  if (u) urls.push(u);
                }
                setReportForm({ ...reportForm, photos: [...reportForm.photos, ...urls] });
              }} />
              {reportForm.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {reportForm.photos.map((u, i) => (
                    <img key={i} src={u} className="h-16 w-16 rounded object-cover" />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium">PDF report</label>
              <Input type="file" accept="application/pdf" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const u = await uploadFile(f, "pdf");
                if (u) setReportForm({ ...reportForm, report_url: u });
              }} />
              {reportForm.report_url && <a href={reportForm.report_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 inline-block">Uploaded PDF</a>}
            </div>

            <div>
              <label className="text-xs font-medium">Video (optional)</label>
              <Input type="file" accept="video/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const u = await uploadFile(f, "video");
                if (u) setReportForm({ ...reportForm, video_url: u });
              }} />
              {reportForm.video_url && <a href={reportForm.video_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 inline-block">Uploaded Video</a>}
            </div>

            <Button onClick={submitReport} className="w-full">
              <FileUp className="w-4 h-4 mr-2" />Mark Completed & Notify Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInspections;
