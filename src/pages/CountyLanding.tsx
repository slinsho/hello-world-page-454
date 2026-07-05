import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import PropertyCard from "@/components/PropertyCard";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, TrendingUp, Home as HomeIcon, MapPin } from "lucide-react";
import { COUNTY_FLAGS, countyFromSlug, countySlug, LIBERIA_COUNTIES } from "@/lib/countyFlags";

export default function CountyLanding() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const county = countyFromSlug(slug);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!county) return;
    (async () => {
      setLoading(true);
      const { data: props } = await supabase
        .from("properties")
        .select("*")
        .eq("county", county)
        .eq("status", "active")
        .order("is_promoted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      const rows = props || [];
      const ownerIds = Array.from(new Set(rows.map((p: any) => p.owner_id).filter(Boolean)));
      let profilesMap = new Map<string, any>();
      if (ownerIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, role, verification_status, phone, profile_photo_url")
          .in("id", ownerIds);
        profilesMap = new Map((profs || []).map((p: any) => [p.id, p]));
      }
      setProperties(rows.map((p: any) => ({ ...p, profiles: profilesMap.get(p.owner_id) || null })));
      setLoading(false);
    })();
  }, [county]);

  const stats = useMemo(() => {
    if (!properties.length) return { total: 0, avg: 0, forSale: 0, forRent: 0, promoted: 0 };
    const total = properties.length;
    const avg = Math.round(properties.reduce((s, p) => s + (Number(p.price_usd) || 0), 0) / total);
    const forSale = properties.filter((p) => p.listing_type === "for_sale").length;
    const forRent = properties.filter((p) => p.listing_type === "for_rent" || p.listing_type === "for_lease").length;
    const promoted = properties.filter((p) => p.is_promoted).length;
    return { total, avg, forSale, forRent, promoted };
  }, [properties]);

  if (!county) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">County not found</h1>
          <p className="text-muted-foreground mb-6">
            "{slug}" isn't one of Liberia's 15 counties.
          </p>
          <Link to="/explore-counties">
            <Button>Browse all counties</Button>
          </Link>
        </div>
      </div>
    );
  }

  const flag = COUNTY_FLAGS[county];
  const others = LIBERIA_COUNTIES.filter((c) => c !== county).slice(0, 6);

  return (
    <>
      <SEOHead
        title={`${county} County Properties | L-Prop`}
        description={`Browse ${stats.total} active listings in ${county} County, Liberia. Homes, apartments, land and shops.`}
        canonical={`${window.location.origin}/county/${countySlug(county)}`}
      />
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />

        {/* Hero with flag */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 opacity-20 blur-2xl">
            <img src={flag} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-4 md:py-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="w-32 md:w-48 aspect-[5/3] rounded-2xl overflow-hidden border border-border shadow-xl bg-card shrink-0">
                <img src={flag} alt={`${county} County flag`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Liberia</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{county} County</h1>
                <p className="text-muted-foreground text-sm md:text-base mt-1">
                  {stats.total > 0
                    ? `${stats.total} active ${stats.total === 1 ? "listing" : "listings"} · avg $${stats.avg.toLocaleString()}`
                    : "No active listings yet."}
                </p>
              </div>
            </div>

            {/* Stat chips */}
            {stats.total > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <StatChip icon={Building2} label="Active" value={stats.total.toString()} />
                <StatChip icon={HomeIcon} label="For sale" value={stats.forSale.toString()} />
                <StatChip icon={HomeIcon} label="For rent" value={stats.forRent.toString()} />
                <StatChip icon={TrendingUp} label="Avg price" value={`$${(stats.avg / 1000).toFixed(0)}k`} />
              </div>
            )}
          </div>
        </div>

        {/* Listings */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold">Listings in {county}</h2>
            {stats.promoted > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {stats.promoted} promoted
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card h-72 animate-pulse" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={`No active listings in ${county} yet`}
              description="Check back soon or explore other counties."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}

          {/* Other counties */}
          <div className="mt-12">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Explore other counties
            </h3>
            <div className="flex flex-wrap gap-2">
              {others.map((c) => (
                <Link
                  key={c}
                  to={`/county/${countySlug(c)}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/50 transition-colors text-sm"
                >
                  <img src={COUNTY_FLAGS[c]} alt="" className="h-4 w-6 object-cover rounded-sm" />
                  {c}
                </Link>
              ))}
              <Link
                to="/explore-counties"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
              >
                See all 15 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-bold text-sm truncate">{value}</p>
      </div>
    </div>
  );
}
