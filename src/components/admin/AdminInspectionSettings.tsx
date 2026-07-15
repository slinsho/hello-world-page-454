import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Save } from "lucide-react";

/**
 * AdminInspectionSettings — lets admins edit the promo banner and marketing
 * copy that appears on the Property Inspection page.
 * Stored in the platform_settings table under stable keys.
 */
const KEYS = [
  { key: "inspection_banner_image", label: "Banner image URL", type: "url", placeholder: "https://…/banner.jpg" },
  { key: "inspection_banner_text", label: "Banner text / promo message", type: "textarea", placeholder: "Get 10% off any inspection this month…" },
  { key: "inspection_page_headline", label: "Page headline (optional)", type: "text", placeholder: "Book a trusted inspection" },
  { key: "inspection_page_subtext", label: "Page subtext (optional)", type: "textarea", placeholder: "Our verified inspectors protect you from bad deals." },
] as const;

export default function AdminInspectionSettings() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key,value")
        .in("key", KEYS.map((k) => k.key));
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value ?? ""; });
      setValues(map);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const rows = KEYS.map((k) => ({ key: k.key, value: values[k.key] ?? "" }));
    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inspection page updated" });
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Inspection Page</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control the promo banner and marketing copy shown on the Property Inspection page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="w-4 h-4 text-primary" /> Banner &amp; copy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {KEYS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              ) : (
                <Input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}

          {values.inspection_banner_image && (
            <div className="rounded-xl overflow-hidden border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 bg-muted">Preview</p>
              <img src={values.inspection_banner_image} alt="Preview" className="w-full h-40 object-cover" />
              {values.inspection_banner_text && (
                <p className="p-3 text-sm">{values.inspection_banner_text}</p>
              )}
            </div>
          )}

          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
