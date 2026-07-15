import { useState, useEffect } from "react";
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
import { ArrowLeft, MapPin, FileSearch, HandCoins, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { notifyAdmins } from "@/lib/notifyAdmins";

// NOTE: `inspection_type` must be one of: documents_legitimacy | help_me_buy
// (DB CHECK constraint). "Location" tier removed at the user's request.
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

const PropertyInspection = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [tier, setTier] = useState<string>("documents_legitimacy");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", preferred_date: "", notes: "", budget: "", payment_reference: "" });
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ image?: string; text?: string; headline?: string; subtext?: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
      setProperty(data);
      if (user) {
        const { data: p } = await supabase.from("profiles").select("name, phone, email").eq("id", user.id).maybeSingle();
        if (p) setForm((f) => ({ ...f, full_name: p.name || "", phone: p.phone || "", email: p.email || "" }));
      }
      const { data: settings } = await supabase.from("platform_settings").select("key,value").in("key", ["inspection_banner_image", "inspection_banner_text", "inspection_page_headline", "inspection_page_subtext"]);
      const map: Record<string, string> = {};
      (settings || []).forEach((s: any) => { map[s.key] = s.value; });
      if (map.inspection_banner_image || map.inspection_banner_text || map.inspection_page_headline || map.inspection_page_subtext) {
        setBanner({
          image: map.inspection_banner_image,
          text: map.inspection_banner_text,
          headline: map.inspection_page_headline,
          subtext: map.inspection_page_subtext,
        });
      }
    })();
  }, [propertyId, user]);

  const selectedTier = TIERS.find((t) => t.key === tier);
  const helpBuyFee = property ? +(Number(property.price_usd) * 0.04).toFixed(2) : 0;
  const fee = selectedTier?.key === "help_me_buy" ? helpBuyFee : selectedTier?.price || 0;

  const submit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!tier) { toast({ title: "Select an inspection type", variant: "destructive" }); return; }
    if (!form.full_name || !form.phone) { toast({ title: "Name and phone required", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await (supabase.from("property_inspections") as any).insert({
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
      payment_reference: form.payment_reference || null,
      status: "pending",
    });
    setLoading(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    await notifyAdmins({ title: "New Inspection Request", message: `${form.full_name} requested a ${selectedTier?.label} inspection.`, type: "status_updates" });
    toast({ title: "Request submitted", description: "Our team will contact you shortly." });
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-24">
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

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Admin-editable hero */}
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-5 shadow-xl relative">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3 h-3" /> Verified inspectors
            </div>
            <h1 className="text-xl font-extrabold leading-tight">
              {banner?.headline || "Buy with total confidence"}
            </h1>
            <p className="text-xs opacity-90 mt-1.5 leading-relaxed">
              {banner?.subtext || "Our licensed inspectors verify the legal papers and negotiate on your behalf so you never overpay."}
            </p>
          </div>
        </div>

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

        {/* Admin-editable promo banner (set via platform_settings keys: inspection_banner_image, inspection_banner_text). */}
        {banner && (banner.image || banner.text) && (
          <div className="rounded-2xl overflow-hidden border shadow-sm bg-card">
            {banner.image && (
              <img src={banner.image} alt="Promo banner" className="w-full h-32 object-cover" />
            )}
            {banner.text && (
              <div className="p-3 text-sm text-foreground/90">{banner.text}</div>
            )}
          </div>
        )}

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
              <Input placeholder="Payment Reference (Sender Name - Ref)" value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} className="rounded-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl border-0 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] opacity-80 uppercase tracking-wide">Total Payable</p>
              <p className="text-2xl font-bold">${fee.toFixed(2)}</p>
            </div>
            <Button onClick={submit} disabled={loading} variant="secondary" size="lg" className="rounded-xl font-semibold">
              <Lock className="w-4 h-4 mr-2" />
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PropertyInspection;
