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
 * AdminInspectionSettings — controls every editable section of the
 * Property Inspection page. Stored in platform_settings under stable keys.
 *
 * Multi-line fields use one item per line. Some use "a | b | c" pipe syntax
 * so admins can edit without touching JSON.
 */
const KEYS = [
  { key: "inspection_hero_headline", label: "Hero headline", type: "text", placeholder: "Buy with total confidence" },
  { key: "inspection_hero_subtext", label: "Hero subtext", type: "textarea", placeholder: "Our licensed inspectors verify legal papers and negotiate on your behalf." },
  { key: "inspection_hero_chips", label: "Hero trust chips (comma-separated)", type: "text", placeholder: "Verified Inspectors, Secure Payment, Money-Back Guarantee" },
  { key: "inspection_banner_image", label: "Promo banner image URL", type: "url", placeholder: "https://…/banner.jpg" },
  { key: "inspection_banner_text", label: "Promo banner text", type: "textarea", placeholder: "Get 10% off any inspection this month…" },
  { key: "inspection_steps", label: "How it works — one step per line as: Title | Description", type: "textarea", placeholder: "Choose Service | Pick the inspection tier that fits you\nSubmit Details | Fill your info and payment\nWe Inspect | Our team visits the property\nReceive Report | Get photos, docs, and findings\nBuy Safely | Proceed with total confidence" },
  { key: "inspection_compare_rows", label: "Comparison table — one row per line as: Feature | Legal | Concierge", type: "textarea", placeholder: "Title Deed Check | ✓ | ✓\nOwnership Verification | ✓ | ✓\nOn-site Visit | ✗ | ✓\nPrice Negotiation | ✗ | ✓\nDocument Handling | ✗ | ✓" },
  { key: "inspection_payment_methods", label: "Payment methods — one per line as: Provider | Number/Details", type: "textarea", placeholder: "Orange Money | 0777 123 456\nMTN Mobile Money | 0888 123 456\nBank Transfer | Ecobank — 0011223344" },
  { key: "inspection_footer_note", label: "Footer note / guarantee message", type: "textarea", placeholder: "100% money-back guarantee if the property does not match our inspection report." },
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
          Control every section of the Property Inspection page — hero, steps, comparison table, payments, and promo banner.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="w-4 h-4 text-primary" /> Page content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {KEYS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  rows={4}
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
