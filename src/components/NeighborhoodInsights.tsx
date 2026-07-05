import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, GraduationCap, HeartPulse, ShoppingBag, Users, Sparkles,
  Stethoscope, Trees, Store, UtensilsCrossed, Bus, Briefcase, Wallet, Home, Star,
} from "lucide-react";

interface CountyInsight {
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

interface Props {
  county: string;
  compact?: boolean;
}

/**
 * NeighborhoodInsights — curated county-level context surfaced on property
 * detail pages and the "Near Me" hero. Data is admin-editable via
 * Admin → County Insights.
 */
export function NeighborhoodInsights({ county, compact = false }: Props) {
  const [data, setData] = useState<CountyInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: row } = await supabase
        .from("county_insights" as any)
        .select("*")
        .eq("county", county)
        .maybeSingle();
      if (active) {
        setData((row as any) || null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [county]);

  if (loading || !data) return null;

  const hasStats =
    data.population || data.schools_count != null || data.hospitals_count != null || data.markets_count != null;
  const hasContent = data.overview || hasStats || (data.highlights && data.highlights.length > 0);
  if (!hasContent) return null;

  const stats = [
    { icon: Users, label: "Population", value: data.population },
    { icon: Briefcase, label: "Employment", value: data.employment_rate },
    { icon: Wallet, label: "Avg. income", value: data.avg_household_income },
    { icon: Home, label: "Avg. property", value: data.avg_property_price },
    { icon: GraduationCap, label: "Schools", value: data.schools_count?.toLocaleString() },
    { icon: HeartPulse, label: "Hospitals", value: data.hospitals_count?.toLocaleString() },
    { icon: Stethoscope, label: "Clinics", value: data.clinics_count?.toLocaleString() },
    { icon: ShoppingBag, label: "Markets", value: data.markets_count?.toLocaleString() },
    { icon: Store, label: "Shopping", value: data.shopping_centers_count?.toLocaleString() },
    { icon: UtensilsCrossed, label: "Restaurants", value: data.restaurants_count?.toLocaleString() },
    { icon: Trees, label: "Parks", value: data.parks_count?.toLocaleString() },
  ].filter((s) => s.value);

  const hasContent =
    data.overview ||
    stats.length > 0 ||
    data.public_transport ||
    data.livability_score != null ||
    (data.highlights && data.highlights.length > 0);
  if (!hasContent) return null;

  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden ${compact ? "" : "mb-5"}`}>
      {data.image_url && !compact && (
        <div className="h-32 w-full overflow-hidden bg-muted">
          <img src={data.image_url} alt={`${county} County`} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-base">{county} at a glance</h3>
          </div>
          {data.livability_score != null && (
            <div className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5">
              <Star className="h-3 w-3 text-primary fill-primary" />
              <span className="text-[11px] font-semibold text-primary">
                {Number(data.livability_score).toFixed(1)}/10
              </span>
            </div>
          )}
        </div>

        {data.overview && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{data.overview}</p>
        )}

        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                <s.icon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold truncate">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.public_transport && (
          <div className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 mb-3">
            <Bus className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Public transport</p>
              <p className="text-sm">{data.public_transport}</p>
            </div>
          </div>
        )}

        {data.highlights && data.highlights.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium">Highlights</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.highlights.map((h, i) => (
                <span key={i} className="text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5 border border-primary/20">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NeighborhoodInsights;
