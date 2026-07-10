import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FeaturedPropertiesBanner } from "@/components/FeaturedPropertiesBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import PropertyCard from "@/components/PropertyCard";
import PropertyList from "@/components/PropertyList";
import NearMePropertyCard from "@/components/NearMePropertyCard";
import Navbar from "@/components/Navbar";
import { HomepageBanners } from "@/components/HomepageBanners";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import MarketTrends from "@/components/MarketTrends";
import PopularAreas from "@/components/PopularAreas";
import LazyOnVisible from "@/components/LazyOnVisible";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight } from "lucide-react";
import { COUNTY_FLAGS, LIBERIA_COUNTIES, countySlug } from "@/lib/countyFlags";
import { Badge } from "@/components/ui/badge";
import type { PropertyListFilters, PropertySort } from "@/hooks/usePropertyList";

const Index = () => {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const [searchParams] = useSearchParams();
  const [heroProperty, setHeroProperty] = useState<any | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);
  const [nearMeProperties, setNearMeProperties] = useState<any[]>([]);
  const [userCounty, setUserCounty] = useState<string>("");

  const typeFilter = searchParams.get("type");
  const listingFilter = searchParams.get("listing");
  const countyFilter = searchParams.get("county");
  const districtFilter = searchParams.get("district");
  const cityFilter = searchParams.get("city");
  const communityFilter = searchParams.get("community");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const searchQuery = searchParams.get("search");

  // Build filters for the reusable list (URL params take precedence over preferences).
  const listFilters: PropertyListFilters = useMemo(() => {
    const effectiveType = typeFilter || preferences.default_property_type || null;
    const effectiveListing = listingFilter || preferences.default_listing_type || null;
    const effectiveCounty = countyFilter || preferences.default_county || null;
    return {
      propertyType: effectiveType && effectiveType !== "all" ? effectiveType : undefined,
      listingType: effectiveListing && effectiveListing !== "all" ? effectiveListing : undefined,
      county: effectiveCounty && effectiveCounty !== "all" ? effectiveCounty : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search: searchQuery || undefined,
    };
  }, [typeFilter, listingFilter, countyFilter, minPrice, maxPrice, searchQuery, preferences.default_property_type, preferences.default_listing_type, preferences.default_county]);

  const sortOrder = (preferences.default_sort_order as PropertySort) || "newest";

  // Hero: a single promoted-first result for the LCP card.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHeroLoading(true);
      let q = supabase.from("properties").select("*").eq("status", "active");
      if (listFilters.propertyType) q = q.eq("property_type", listFilters.propertyType as any);
      if (listFilters.listingType) q = q.eq("listing_type", listFilters.listingType as any);
      if (listFilters.county) q = q.eq("county", listFilters.county);
      if (districtFilter && districtFilter !== "all") q = q.eq("district", districtFilter);
      if (cityFilter && cityFilter !== "all") q = q.eq("city", cityFilter);
      if (communityFilter && communityFilter !== "all") q = q.eq("community", communityFilter);
      if (listFilters.minPrice != null) q = q.gte("price_usd", listFilters.minPrice);
      if (listFilters.maxPrice != null) q = q.lte("price_usd", listFilters.maxPrice);
      q = q.order("is_promoted", { ascending: false }).order("created_at", { ascending: false }).limit(1);
      const { data } = await q;
      const row = (data || [])[0];
      if (!row) {
        if (!cancelled) { setHeroProperty(null); setHeroLoading(false); }
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, name, role, verification_status, phone, profile_photo_url")
        .eq("id", row.owner_id)
        .maybeSingle();
      if (!cancelled) {
        setHeroProperty({ ...row, profiles: prof || null });
        setHeroLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [listFilters, districtFilter, cityFilter, communityFilter]);

  // Near Me preview.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setUserCounty(""); setNearMeProperties([]); return; }
      const { data: profile } = await supabase.from("profiles").select("county").eq("id", user.id).maybeSingle();
      const county = profile?.county || "";
      if (cancelled) return;
      setUserCounty(county);
      if (!county) { setNearMeProperties([]); return; }
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .eq("county", county)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!cancelled) setNearMeProperties(data || []);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead />
      <Navbar />

      <main className="px-4 pt-4 md:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        <HomepageBanners />
        <FeaturedPropertiesBanner />
        {user && <RecentlyViewed />}

        {/* Hero card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {heroLoading ? (
            <Skeleton className="h-[340px] w-full rounded-2xl" />
          ) : heroProperty ? (
            <PropertyCard property={heroProperty} priority variant="featured" />
          ) : null}
        </div>

        {/* Explore Counties horizontal row */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Explore by County</h2>
            </div>
            <Link to="/explore-counties">
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-5 md:px-5 scrollbar-hide">
            {LIBERIA_COUNTIES.map((name) => (
              <Link
                key={name}
                to={`/county/${countySlug(name)}`}
                className="group flex-shrink-0 w-28 text-left rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
              >
                <div className="relative aspect-[5/3] rounded-xl bg-muted overflow-hidden ring-1 ring-border group-hover:ring-primary/60 shadow-sm">
                  <img
                    src={COUNTY_FLAGS[name]}
                    alt={`${name} County flag`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="pt-2 px-0.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">County</p>
                  <p className="font-semibold text-xs truncate">{name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Near Me Section */}
        {nearMeProperties.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Near Me</h2>
                <span className="text-sm text-muted-foreground">({userCounty})</span>
              </div>
              <Link to={`/near-me?county=${encodeURIComponent(userCounty)}`}>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
              {nearMeProperties.map((property) => (
                <NearMePropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        )}

        {/* Main paginated list */}
        <PropertyList
          scope="home"
          filters={listFilters}
          sort={sortOrder}
          pageSize={15}
          priorityCount={0}
          gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
          emptyTitle="No properties listed yet"
          emptyDescription="Be the first to upload a property!"
          insertAfter={6}
          insertContent={
            <LazyOnVisible minHeight={320} className="my-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MarketTrends />
                <PopularAreas />
              </div>
            </LazyOnVisible>
          }
        />
      </main>
    </div>
  );
};

export default Index;
