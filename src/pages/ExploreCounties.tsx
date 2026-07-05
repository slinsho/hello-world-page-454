import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Building2 } from "lucide-react";
import { COUNTY_FLAGS, LIBERIA_COUNTIES, countySlug } from "@/lib/countyFlags";

interface CountyStat {
  active: number;
  avgPrice: number;
}

export default function ExploreCounties() {
  const [stats, setStats] = useState<Record<string, CountyStat>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("properties")
        .select("county, price_usd, status")
        .eq("status", "active")
        .limit(5000);
      const s: Record<string, { count: number; sum: number }> = {};
      (data || []).forEach((p: any) => {
        if (!p.county) return;
        const k = p.county.trim();
        s[k] = s[k] || { count: 0, sum: 0 };
        s[k].count += 1;
        s[k].sum += Number(p.price_usd) || 0;
      });
      const out: Record<string, CountyStat> = {};
      Object.entries(s).forEach(([k, v]) => {
        out[k] = { active: v.count, avgPrice: v.count ? Math.round(v.sum / v.count) : 0 };
      });
      setStats(out);
      setLoading(false);
    })();
  }, []);

  const counties = useMemo(() => {
    const term = q.trim().toLowerCase();
    return LIBERIA_COUNTIES.filter((c) => (term ? c.toLowerCase().includes(term) : true));
  }, [q]);

  return (
    <>
      <SEOHead
        title="Explore Liberia by County | L-Prop"
        description="Browse verified properties across all 15 counties of Liberia. Find homes, apartments, land and shops by county."
      />
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-8">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Explore Liberia by County</h1>
            <p className="text-muted-foreground text-sm mt-1">
              All 15 counties of Liberia. Tap a flag to see local listings.
            </p>
          </div>


          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search counties..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {counties.map((name) => {
              const stat = stats[name];
              const active = stat?.active || 0;
              const avg = stat?.avgPrice || 0;
              return (
                <Link
                  key={name}
                  to={`/county/${countySlug(name)}`}
                  className="group text-left rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/60 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative aspect-[5/3] bg-muted overflow-hidden border-b border-border">
                    <img
                      src={COUNTY_FLAGS[name]}
                      alt={`${name} County flag`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {active > 0 && (
                      <Badge className="absolute top-2 right-2 text-[10px] shadow-md">
                        {active} active
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">County</p>
                      <p className="font-semibold text-sm truncate flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {name}
                      </p>
                    </div>
                    {!loading && active > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-center">
                        <div className="rounded-md bg-muted/60 py-1">
                          <p className="text-xs font-bold text-primary flex items-center justify-center gap-0.5">
                            <Building2 className="h-3 w-3" />
                            {active}
                          </p>
                          <p className="text-[9px] uppercase text-muted-foreground">Listings</p>
                        </div>
                        <div className="rounded-md bg-muted/60 py-1">
                          <p className="text-xs font-bold">${(avg / 1000).toFixed(0)}k</p>
                          <p className="text-[9px] uppercase text-muted-foreground">Avg</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
