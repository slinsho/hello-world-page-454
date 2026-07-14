import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, FileSearch, HandCoins, Check } from "lucide-react";
import { notifyAdmins } from "@/lib/notifyAdmins";

const TIERS = [
  { key: "location", label: "Location & Availability Check", desc: "We physically visit the property to confirm it exists and is truly available.", price: 10, icon: MapPin },
  { key: "legal", label: "Legal Documents & Legitimacy Check", desc: "We verify ownership documents, title, and property legitimacy.", price: 80, icon: FileSearch },
  { key: "help_buy", label: "Help Me Buy (Concierge)", desc: "Full purchase assistance. Fee: 0.4% of the property price.", price: 0, icon: HandCoins },
];

const PropertyInspection = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", preferred_date: "", notes: "", budget: "", payment_reference: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
      setProperty(data);
      if (user) {
        const { data: p } = await supabase.from("profiles").select("name, phone, email").eq("id", user.id).maybeSingle();
        if (p) setForm((f) => ({ ...f, full_name: p.name || "", phone: p.phone || "", email: p.email || "" }));
      }
    })();
  }, [propertyId, user]);

  const selectedTier = TIERS.find((t) => t.key === tier);
  const helpBuyFee = property ? +(Number(property.price_usd) * 0.004).toFixed(2) : 0;
  const fee = selectedTier?.key === "help_buy" ? helpBuyFee : selectedTier?.price || 0;

  const submit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!tier) { toast({ title: "Select an inspection type", variant: "destructive" }); return; }
    if (!form.full_name || !form.phone) { toast({ title: "Name and phone required", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.from("property_inspections").insert({
      property_id: propertyId, requester_id: user.id, inspection_type: tier,
      full_name: form.full_name, phone: form.phone, email: form.email || null,
      preferred_date: form.preferred_date || null, notes: form.notes || null,
      budget_usd: form.budget ? Number(form.budget) : null,
      fee_usd: fee, payment_reference: form.payment_reference || null, status: "pending",
    });
    setLoading(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    await notifyAdmins({ title: "New Inspection Request", message: `${form.full_name} requested a ${selectedTier?.label} inspection.`, type: "status_updates" });
    toast({ title: "Request submitted", description: "Our team will contact you shortly." });
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-bold">Request Property Inspection</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {property && (
          <Card>
            <CardContent className="p-3 flex gap-3 items-center">
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                {property.photos?.[0] && <img src={property.photos[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{property.title}</p>
                <p className="text-xs text-muted-foreground">${Number(property.price_usd).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="font-bold mb-2">Choose Inspection Type</h2>
          <div className="space-y-2">
            {TIERS.map((t) => {
              const Icon = t.icon;
              const active = tier === t.key;
              return (
                <button key={t.key} onClick={() => setTier(t.key)} className={`w-full text-left rounded-2xl border-2 p-4 flex gap-3 transition-all ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{t.label}</p>
                      <p className="font-bold text-primary text-sm">
                        {t.key === "help_buy" ? (property ? `$${helpBuyFee}` : "0.4%") : `$${t.price}`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </div>
                  {active && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {tier && (
          <div className="space-y-3">
            <h2 className="font-bold">Your Details</h2>
            <Input placeholder="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div>
              <Label className="text-xs text-muted-foreground">Preferred Inspection Date</Label>
              <Input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
            </div>
            {tier === "help_buy" && (
              <Input type="number" placeholder="Your Budget (USD)" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            )}
            <Textarea placeholder="Additional notes for our team..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Input placeholder="Payment Reference (Sender Name - Ref)" value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} />

            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm">Total Fee</span>
                <span className="font-bold text-primary text-lg">${fee.toFixed(2)}</span>
              </CardContent>
            </Card>

            <Button onClick={submit} disabled={loading} className="w-full h-12">
              {loading ? "Submitting..." : "Submit Inspection Request"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PropertyInspection;
