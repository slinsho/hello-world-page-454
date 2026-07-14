import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, CalendarDays, Clock, Zap, Building2 } from "lucide-react";

const defaults = {
  weekend_surcharge_pct: 0, weekend_days: [5, 6],
  los_discount_pct: 0, los_min_nights: 7,
  early_bird_pct: 0, early_bird_days: 30,
  last_minute_pct: 0, last_minute_days: 3,
};

const HotelPricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [rules, setRules] = useState<any>(defaults);
  const [ruleId, setRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("hotels").select("id, name").eq("owner_id", user.id)
      .then(({ data }) => { setHotels(data || []); if (data?.[0]) setHotelId(data[0].id); });
  }, [user, navigate]);

  useEffect(() => {
    if (!hotelId) return;
    (supabase.from("hotel_pricing_rules" as any) as any).select("*").eq("hotel_id", hotelId).maybeSingle()
      .then(({ data }: any) => {
        if (data) { setRules(data); setRuleId(data.id); }
        else { setRules(defaults); setRuleId(null); }
      });
  }, [hotelId]);

  const save = async () => {
    if (!hotelId) return;
    const payload = {
      hotel_id: hotelId,
      weekend_surcharge_pct: Number(rules.weekend_surcharge_pct) || 0,
      weekend_days: rules.weekend_days,
      los_discount_pct: Number(rules.los_discount_pct) || 0,
      los_min_nights: Number(rules.los_min_nights) || 1,
      early_bird_pct: Number(rules.early_bird_pct) || 0,
      early_bird_days: Number(rules.early_bird_days) || 0,
      last_minute_pct: Number(rules.last_minute_pct) || 0,
      last_minute_days: Number(rules.last_minute_days) || 0,
    };
    const q = ruleId
      ? (supabase.from("hotel_pricing_rules" as any) as any).update(payload).eq("id", ruleId).select().single()
      : (supabase.from("hotel_pricing_rules" as any) as any).insert(payload).select().single();
    const { data, error } = await q;
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setRules(data); setRuleId(data.id);
    toast({ title: "Pricing rules saved" });
  };

  const Row = ({ icon: Icon, color, title, subtitle, children }: any) => (
    <div className="rounded-3xl bg-background border p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white`}><Icon className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px]">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <HotelShellLayout title="Pricing" subtitle="Dynamic rules">
      <div className="space-y-4">
        <div className="rounded-2xl bg-muted/60 p-1">
          <Select value={hotelId} onValueChange={setHotelId}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-10 text-[14px] font-semibold">
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Select hotel" /></div>
            </SelectTrigger>
            <SelectContent>{hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <Row icon={CalendarDays} color="bg-amber-500" title="Weekend surcharge" subtitle="Raise price on selected days">
          <div className="flex items-center gap-2 mb-2">
            <Input type="number" value={rules.weekend_surcharge_pct} onChange={(e) => setRules({ ...rules, weekend_surcharge_pct: e.target.value })} className="w-24" />
            <span className="text-sm text-muted-foreground">% surcharge</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {dayNames.map((d, i) => {
              const on = rules.weekend_days?.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => {
                    const set = new Set<number>(rules.weekend_days || []);
                    on ? set.delete(i) : set.add(i);
                    setRules({ ...rules, weekend_days: Array.from(set).sort() });
                  }}
                  className={`px-2.5 h-8 rounded-full text-[12px] font-semibold border ${on ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground"}`}
                >{d}</button>
              );
            })}
          </div>
        </Row>

        <Row icon={TrendingUp} color="bg-emerald-500" title="Length-of-stay discount" subtitle="Reward longer stays">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[11px] text-muted-foreground">Min nights</label><Input type="number" value={rules.los_min_nights} onChange={(e) => setRules({ ...rules, los_min_nights: e.target.value })} /></div>
            <div><label className="text-[11px] text-muted-foreground">Discount %</label><Input type="number" value={rules.los_discount_pct} onChange={(e) => setRules({ ...rules, los_discount_pct: e.target.value })} /></div>
          </div>
        </Row>

        <Row icon={Clock} color="bg-blue-500" title="Early-bird deal" subtitle="Reward advance bookings">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[11px] text-muted-foreground">Book X days ahead</label><Input type="number" value={rules.early_bird_days} onChange={(e) => setRules({ ...rules, early_bird_days: e.target.value })} /></div>
            <div><label className="text-[11px] text-muted-foreground">Discount %</label><Input type="number" value={rules.early_bird_pct} onChange={(e) => setRules({ ...rules, early_bird_pct: e.target.value })} /></div>
          </div>
        </Row>

        <Row icon={Zap} color="bg-rose-500" title="Last-minute deal" subtitle="Fill unsold rooms">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[11px] text-muted-foreground">Within X days</label><Input type="number" value={rules.last_minute_days} onChange={(e) => setRules({ ...rules, last_minute_days: e.target.value })} /></div>
            <div><label className="text-[11px] text-muted-foreground">Discount %</label><Input type="number" value={rules.last_minute_pct} onChange={(e) => setRules({ ...rules, last_minute_pct: e.target.value })} /></div>
          </div>
        </Row>

        <Button onClick={save} className="w-full h-12 rounded-full">Save pricing rules</Button>
      </div>
    </HotelShellLayout>
  );
};

export default HotelPricingPage;