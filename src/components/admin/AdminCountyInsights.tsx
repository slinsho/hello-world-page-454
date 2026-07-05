import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Save, Upload, X } from "lucide-react";
import { resizeImage } from "@/lib/imageResize";

interface Row {
  id: string;
  county: string;
  overview: string | null;
  population: string | null;
  schools_count: number | null;
  hospitals_count: number | null;
  clinics_count: number | null;
  markets_count: number | null;
  parks_count: number | null;
  shopping_centers_count: number | null;
  restaurants_count: number | null;
  public_transport: string | null;
  employment_rate: string | null;
  avg_household_income: string | null;
  avg_property_price: string | null;
  livability_score: number | null;
  highlights: string[] | null;
  image_url: string | null;
}

export function AdminCountyInsights() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    setForm({ ...r, highlightsRaw: (r.highlights || []).join(", ") });
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const resized = await resizeImage(file, 1600, 1600, 0.75);
      const ext = resized.type.includes("webp") ? "webp" : "jpg";
      const path = `county-insights/${(form.county || "county").toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("blog-media").upload(path, resized, {
        cacheControl: "3600",
        upsert: true,
        contentType: resized.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: "Photo uploaded", description: "Remember to save your changes." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(editing);
    const highlights = (form.highlightsRaw || "").split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      overview: form.overview || null,
      population: form.population || null,
      schools_count: form.schools_count ?? null,
      hospitals_count: form.hospitals_count ?? null,
      clinics_count: form.clinics_count ?? null,
      markets_count: form.markets_count ?? null,
      parks_count: form.parks_count ?? null,
      shopping_centers_count: form.shopping_centers_count ?? null,
      restaurants_count: form.restaurants_count ?? null,
      public_transport: form.public_transport || null,
      employment_rate: form.employment_rate || null,
      avg_household_income: form.avg_household_income || null,
      avg_property_price: form.avg_property_price || null,
      livability_score: form.livability_score ?? null,
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

  const numberField = (label: string, key: keyof Row) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={(form[key] as number | null) ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value ? Number(e.target.value) : null })}
      />
    </div>
  );

  const textField = (label: string, key: keyof Row, placeholder?: string) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={(form[key] as string | null) ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );

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
          const filled = r.overview || r.population || r.image_url || (r.highlights && r.highlights.length);
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
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
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

                  <div>
                    <Label className="text-xs">County Photo</Label>
                    {form.image_url ? (
                      <div className="relative rounded-lg overflow-hidden border border-border mt-1">
                        <img src={form.image_url} alt="County" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image_url: null })}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-1 flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {uploading ? "Uploading…" : "Upload photo from your device"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhotoUpload(f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {textField("Population", "population", "e.g. 1.5M")}
                    {textField("Employment rate", "employment_rate", "e.g. 68%")}
                    {textField("Avg household income", "avg_household_income", "e.g. $450/mo")}
                    {textField("Avg property price", "avg_property_price", "e.g. $45,000")}
                    {numberField("Schools", "schools_count")}
                    {numberField("Hospitals", "hospitals_count")}
                    {numberField("Clinics", "clinics_count")}
                    {numberField("Markets", "markets_count")}
                    {numberField("Parks & recreation", "parks_count")}
                    {numberField("Shopping centers", "shopping_centers_count")}
                    {numberField("Restaurants", "restaurants_count")}
                    <div>
                      <Label className="text-xs">Livability score (0–10)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={10}
                        value={form.livability_score ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, livability_score: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Public transport</Label>
                    <Textarea
                      rows={2}
                      value={form.public_transport || ""}
                      onChange={(e) => setForm({ ...form, public_transport: e.target.value })}
                      placeholder="e.g. Shared taxis, keh-keh, and Monrovia bus routes"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Highlights (comma separated)</Label>
                    <Input
                      value={form.highlightsRaw || ""}
                      onChange={(e) => setForm({ ...form, highlightsRaw: e.target.value })}
                      placeholder="Beaches, University, Port"
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
