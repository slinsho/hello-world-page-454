import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, FileSearch, HandCoins, ShieldCheck, Lock, Sparkles,
  Check, X, Wallet, BadgeCheck, Star, Award, Users, Clock, MessageSquare,
} from "lucide-react";
import { notifyAdmins } from "@/lib/notifyAdmins";

const TIERS = [
  {
    key: "documents_legitimacy",
    label: "Legal Documents Check",
    tabLabel: "Legal",
    desc: "We verify ownership documents, title deed, and confirm the property's legal legitimacy.",
    price: 80,
    icon: FileSearch,
    features: ["Title deed verification", "Ownership confirmation", "Encumbrance check", "Detailed legal report"],
  },
  {
    key: "help_me_buy",
    label: "Help Me Buy — Concierge",
    tabLabel: "Concierge",
    desc: "Full end-to-end purchase assistance from negotiation to hand-over. Fee: 4% of the property price.",
    price: 0,
    icon: HandCoins,
    features: ["Price negotiation on your behalf", "Legal & documentation handling", "Payment escrow guidance", "Ownership transfer support"],
  },
];

const parseLines = (v?: string) =>
  (v || "").split("\n").map((l) => l.trim()).filter(Boolean);

const parsePipes = (v?: string) =>
  parseLines(v).map((l) => l.split("|").map((p) => p.trim()));

const PropertyInspection = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [tier, setTier] = useState<string>("documents_legitimacy");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", preferred_date: "", notes: "", budget: "", payment_reference: "" });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
      setProperty(data);
      if (user) {
        const { data: p } = await supabase.from("profiles").select("name, phone, email").eq("id", user.id).maybeSingle();
        if (p) setForm((f) => ({ ...f, full_name: p.name || "", phone: p.phone || "", email: p.email || "" }));
      }
      const { data: s } = await supabase
        .from("platform_settings")
        .select("key,value")
        .in("key", [
          "inspection_hero_headline", "inspection_hero_subtext", "inspection_hero_chips",
          "inspection_banner_image", "inspection_banner_text",
          "inspection_steps", "inspection_compare_rows", "inspection_payment_methods",
          "inspection_footer_note",
        ]);
      const map: Record<string, string> = {};
      (s || []).forEach((r: any) => { map[r.key] = r.value; });
      setSettings(map);
    })();
  }, [propertyId, user]);

  const chips = useMemo(
    () => (settings.inspection_hero_chips || "Verified Inspectors, Secure Payment, Money-Back Guarantee")
      .split(",").map((c) => c.trim()).filter(Boolean),
    [settings.inspection_hero_chips]
  );
  const steps = useMemo(() => {
    const rows = parsePipes(settings.inspection_steps);
    return rows.length ? rows : [
      ["Choose Service", "Pick the inspection tier that fits you"],
      ["Submit Details", "Fill your info and make payment"],
      ["We Inspect", "Our team visits the property"],
      ["Receive Report", "Get photos, docs, and findings"],
      ["Buy Safely", "Proceed with total confidence"],
    ];
  }, [settings.inspection_steps]);
  const compareRows = useMemo(() => {
    const rows = parsePipes(settings.inspection_compare_rows);
    return rows.length ? rows : [
      ["Title Deed Check", "✓", "✓"],
      ["Ownership Verification", "✓", "✓"],
      ["On-site Visit", "✗", "✓"],
      ["Price Negotiation", "✗", "✓"],
      ["Document Handling", "✗", "✓"],
    ];
  }, [settings.inspection_compare_rows]);
  const paymentMethods = useMemo(() => parsePipes(settings.inspection_payment_methods), [settings.inspection_payment_methods]);

  const selectedTier = TIERS.find((t) => t.key === tier);
  const helpBuyFee = property ? +(Number(property.price_usd) * 0.04).toFixed(2) : 0;
  const fee = selectedTier?.key === "help_me_buy" ? helpBuyFee : selectedTier?.price || 0;

  const submit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!tier) { toast({ title: "Select an inspection type", variant: "destructive" }); return; }
    if (!form.full_name || !form.phone) { toast({ title: "Name and phone required", variant: "destructive" }); return; }
    setLoading(true);
    const { data: inserted, error } = await (supabase.from("property_inspections") as any).insert({
      property_id: propertyId,
      requester_id: user.id,
      requester_name: form.full_name,
      requester_phone: form.phone,
      requester_email: form.email || null,
      inspection_type: tier,
      fee_usd: fee,
      form_data: {
        preferred_date: form.preferred_date || null,
        notes: form.notes || null,
        budget_usd: form.budget ? Number(form.budget) : null,
      },
      status: "pending",
    }).select().single();
    if (error) { setLoading(false); toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }

    // If payment reference provided, submit via RPC (validates + flips payment_status to 'submitted' + notifies admins)
    const raw = (form.payment_reference || "").trim();
    if (raw && inserted?.id) {
      const [sender, ...rest] = raw.includes(" - ") ? raw.split(" - ") : [form.full_name, raw];
      const ref = rest.join(" - ").trim();
      const { error: rpcErr } = await (supabase.rpc as any)("submit_inspection_payment_reference", {
        p_inspection_id: inserted.id,
        p_sender_name: sender.trim(),
        p_ref: ref || raw,
      });
      if (rpcErr) {
        toast({ title: "Payment reference not saved", description: rpcErr.message, variant: "destructive" });
      }
    } else {
      await notifyAdmins({ title: "New Inspection Request", message: `${form.full_name} requested a ${selectedTier?.label} inspection.`, type: "status_updates" });
    }
    setLoading(false);
    toast({ title: "Request submitted", description: raw ? "Payment reference submitted. Admin will verify shortly." : "Our team will contact you shortly." });
    navigate("/profile");
  };

  const renderCell = (v: string) => {
    if (v === "✓" || v.toLowerCase() === "yes" || v.toLowerCase() === "true") {
      return <Check className="w-4 h-4 text-green-600 mx-auto" />;
    }
    if (v === "✗" || v.toLowerCase() === "no" || v.toLowerCase() === "false") {
      return <X className="w-4 h-4 text-muted-foreground mx-auto" />;
    }
    return <span className="text-xs">{v}</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(`/property/${propertyId}`))} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-base leading-tight">Property Inspection</h1>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-600" /> Verified & trusted service
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {/* Hero — compact, admin-editable */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-red-600 to-red-700 text-white p-4 shadow-lg relative">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-2.5 h-2.5" /> Verified service
            </div>
            <h1 className="text-lg font-extrabold leading-tight">
              {settings.inspection_hero_headline || "Buy with total confidence"}
            </h1>
            <p className="text-[12px] opacity-95 mt-1 leading-snug">
              {settings.inspection_hero_subtext || "Our licensed inspectors verify legal papers and negotiate on your behalf."}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {chips.map((c) => (
                <div key={c} className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  <BadgeCheck className="w-2.5 h-2.5" /> {c}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Award, label: "Licensed", sub: "Inspectors" },
            { icon: Clock, label: "48-Hour", sub: "Turnaround" },
            { icon: Lock, label: "Money-Back", sub: "Guarantee" },
          ].map((t, i) => {
            const Ic = t.icon;
            return (
              <div key={i} className="rounded-xl border bg-card p-2.5 text-center">
                <Ic className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-[11px] font-bold leading-tight">{t.label}</p>
                <p className="text-[9px] text-muted-foreground">{t.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Property card */}
        {property && (
          <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
            <CardContent className="p-0">
              <div className="flex gap-3 p-3 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0 shadow">
                  {property.photos?.[0] && <img src={property.photos[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="text-[10px] mb-1">{property.property_type}</Badge>
                  <p className="font-semibold text-sm truncate">{property.title}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {property.county}
                  </p>
                  <p className="text-primary font-bold text-sm mt-0.5">${Number(property.price_usd || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service tiers */}
        <div>
          <h2 className="text-lg font-bold mb-2">Choose your service</h2>
          <Tabs value={tier} onValueChange={setTier} className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-auto p-1 rounded-2xl bg-muted">
              {TIERS.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.key}
                    value={t.key}
                    className="flex flex-col gap-1 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">{t.tabLabel}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsContent key={t.key} value={t.key} className="mt-4 space-y-4">
                  <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{t.label}</p>
                            <p className="text-[11px] text-muted-foreground">Professional inspection service</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase">Fee</p>
                          <p className="text-primary font-bold text-lg leading-none">
                            {t.key === "help_me_buy" ? (property ? `$${helpBuyFee}` : "4%") : `$${t.price}`}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{t.desc}</p>
                      <ul className="space-y-1.5">
                        {t.features.map((f) => (
                          <li key={f} className="text-xs flex items-start gap-2">
                            <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* Comparison table */}
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-4">
            <h2 className="font-bold text-sm mb-3">Compare services</h2>
            <div className="rounded-xl overflow-hidden border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2.5 font-semibold">Feature</th>
                    <th className="p-2.5 font-semibold text-center">Legal</th>
                    <th className="p-2.5 font-semibold text-center">Concierge</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2.5">{row[0]}</td>
                      <td className="p-2.5 text-center">{renderCell(row[1] || "")}</td>
                      <td className="p-2.5 text-center">{renderCell(row[2] || "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-4">
            <h2 className="font-bold text-sm mb-4">How it works</h2>
            <ol className="relative border-l-2 border-primary/20 ml-3 space-y-4">
              {steps.map(([title, desc], i) => (
                <li key={i} className="pl-5 relative">
                  <span className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                  <p className="font-semibold text-sm">{title}</p>
                  {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Promo banner */}
        {(settings.inspection_banner_image || settings.inspection_banner_text) && (
          <div className="rounded-2xl overflow-hidden border shadow-sm bg-card">
            {settings.inspection_banner_image && (
              <img src={settings.inspection_banner_image} alt="Promo banner" className="w-full h-32 object-cover" />
            )}
            {settings.inspection_banner_text && (
              <div className="p-3 text-sm text-foreground/90">{settings.inspection_banner_text}</div>
            )}
          </div>
        )}

        {/* Details form */}
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold text-sm">Your Details</h2>
            <div className="space-y-2">
              <Input placeholder="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-xl" />
              <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
              <Input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
              <div>
                <Label className="text-xs text-muted-foreground">Preferred Inspection Date</Label>
                <Input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} className="rounded-xl" />
              </div>
              {tier === "help_me_buy" && (
                <Input type="number" placeholder="Your Budget (USD)" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="rounded-xl" />
              )}
              <Textarea placeholder="Additional notes for our team..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Payment happens after admin approval — a payment notification is sent then. */}
        <div className="rounded-2xl border border-dashed p-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Wallet className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>No payment now. Once an admin approves your request, you'll get a notification with the payment details and where to submit your payment reference.</span>
        </div>


        {/* Social proof */}
        <div className="rounded-2xl bg-card border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">What buyers say</h3>
          </div>
          <div className="grid gap-2.5">
            {[
              { name: "James K.", county: "Montserrado", text: "Saved me from a fake title. Best $80 I ever spent.", stars: 5 },
              { name: "Grace M.", county: "Nimba", text: "Their concierge negotiated $12k off the asking price.", stars: 5 },
            ].map((t, i) => (
              <div key={i} className="rounded-xl bg-muted/40 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-xs leading-snug">"{t.text}"</p>
                <p className="text-[10px] text-muted-foreground mt-1">— {t.name}, {t.county}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl bg-card border p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Frequently asked</h3>
          </div>
          <div className="divide-y">
            {[
              { q: "How long does an inspection take?", a: "Legal checks: 24–48 hours. Full concierge: 3–5 business days." },
              { q: "What if the property fails inspection?", a: "You get a full refund under our money-back guarantee." },
              { q: "Do you cover properties outside Monrovia?", a: "Yes — we inspect properties across all 15 counties in Liberia." },
            ].map((f, i) => (
              <details key={i} className="py-2 group">
                <summary className="text-xs font-semibold cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-primary group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer guarantee */}
        {settings.inspection_footer_note && (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-3 text-xs text-foreground/90 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <span>{settings.inspection_footer_note}</span>
          </div>
        )}
      </main>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total payable</p>
            <p className="text-xl font-bold text-primary leading-none">${fee.toFixed(2)}</p>
          </div>
          <Button onClick={submit} disabled={loading} size="lg" className="rounded-xl font-semibold flex-1 max-w-xs">
            <Lock className="w-4 h-4 mr-2" />
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyInspection;
