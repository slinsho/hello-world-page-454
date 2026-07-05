import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Save } from "lucide-react";

interface Row {
  id: string;
  county: string;
  overview: string | null;
  population: string | null;
  schools_count: number | null;
  hospitals_count: number | null;
  markets_count: number | null;
  highlights: string[] | null;
  image_url: string | null;
}

export function AdminCountyInsights() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Row> & { highlightsRaw?: string }>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("county_insights" as any).select("*").order("county");
    setRows(((data as any) || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (r: Row) => {
    setEditing(r.id);
    setForm({
      ...r,
      highlightsRaw: (r.highlights || []).join(", "),
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(editing);
    const highlights = (form.highlightsRaw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      overview: form.overview || null,
      population: form.population || null,
      schools_count: form.schools_count ?? null,
      hospitals_count: form.hospitals_count ?? null,
      markets_count: form.markets_count ?? null,
      highlights,
      image_url: form.image_url || null,
    };
    const { error } = await supabase.from("county_insights" as any).update(payload).eq("id", editing);
    setSaving(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: `${form.county} insights updated.` });
    setEditing(null);
    load();
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground text-sm">Loading counties…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> County Insights
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Curated context shown on property detail pages under "at a glance". Edit any county below.
        </p>
      </div>

      <div className="grid gap-3">
        {rows.map((r) => {
          const isEditing = editing === r.id;
          const filled =
            r.overview || r.population || r.schools_count || r.hospitals_count || r.markets_count || (r.highlights && r.highlights.length);
          return (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold">{r.county}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {filled ? "Content added" : "Empty — no content shown yet"}
                  </p>
                </div>
                {!isEditing ? (
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={saving === r.id} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      {saving === r.id ? "Saving…" : "Save"}
                    </Button>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="grid gap-3 mt-2">
                  <div>
                    <Label className="text-xs">Overview</Label>
                    <Textarea
                      rows={3}
                      value={form.overview || ""}
                      onChange={(e) => setForm({ ...form, overview: e.target.value })}
                      placeholder="Short paragraph about this county…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Population (text)</Label>
                      <Input
                        value={form.population || ""}
                        onChange={(e) => setForm({ ...form, population: e.target.value })}
                        placeholder="e.g. 1.5M"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Schools</Label>
                      <Input
                        type="number"
                        value={form.schools_count ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, schools_count: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hospitals</Label>
                      <Input
                        type="number"
                        value={form.hospitals_count ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, hospitals_count: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Markets</Label>
                      <Input
                        type="number"
                        value={form.markets_count ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, markets_count: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Highlights (comma separated)</Label>
                    <Input
                      value={form.highlightsRaw || ""}
                      onChange={(e) => setForm({ ...form, highlightsRaw: e.target.value })}
                      placeholder="Beaches, University, Port"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Image URL (optional)</Label>
                    <Input
                      value={form.image_url || ""}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://…"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminCountyInsights;
