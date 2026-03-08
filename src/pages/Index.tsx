import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FeaturedPropertiesBanner } from "@/components/FeaturedPropertiesBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import PropertyCard from "@/components/PropertyCard";
import NearMePropertyCard from "@/components/NearMePropertyCard";
import Navbar from "@/components/Navbar";
import { HomepageBanners } from "@/components/HomepageBanners";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import MarketTrends from "@/components/MarketTrends";
import PopularAreas from "@/components/PopularAreas";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [nearMeProperties, setNearMeProperties] = useState<any[]>([]);
  const [userCounty, setUserCounty] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const typeFilter = searchParams.get("type");
  const listingFilter = searchParams.get("listing");
  const statusFilter = searchParams.get("status");
  const countyFilter = searchParams.get("county");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from("properties").select("*");

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as "active" | "inactive" | "sold" | "rented");
      } else if (!statusFilter) {
        query = query.eq("status", "active");
      }

      // Apply URL filters first, fall back to user preferences
      const effectiveType = typeFilter || preferences.default_property_type || null;
      if (effectiveType && effectiveType !== "all") {
        query = query.eq("property_type", effectiveType as "house" | "apartment" | "shop");
      }
      const effectiveListing = listingFilter || preferences.default_listing_type || null;
      if (effectiveListing && effectiveListing !== "all") {
        query = query.eq("listing_type", effectiveListing as "for_sale" | "for_rent" | "for_lease");
      }
      const effectiveCounty = countyFilter || preferences.default_county || null;
      if (effectiveCounty && effectiveCounty !== "all") {
        query = query.eq("county", effectiveCounty);
      }
      if (minPrice) {
        query = query.gte("price_usd", parseFloat(minPrice));
      }
      if (maxPrice) {
        query = query.lte("price_usd", parseFloat(maxPrice));
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,county.ilike.%${searchQuery}%`);
      }

      // Apply user's sort preference
      if (preferences.default_sort_order === "price_low") {
        query = query.order("price_usd", { ascending: true });
      } else if (preferences.default_sort_order === "price_high") {
        query = query.order("price_usd", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: propertiesData, error } = await query;

      if (error || !propertiesData) {
        setLoading(false);
        return;
      }

      const ownerIds = [...new Set(propertiesData.map(p => p.owner_id))];
      const [{ data: profilesData }, { data: agentData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, role, verification_status, phone, profile_photo_url")
          .in("id", ownerIds),
        supabase
          .from("verification_requests")
          .select("user_id, agency_name, agency_logo, verification_type")
          .eq("status", "approved")
          .eq("verification_type", "agent")
          .in("user_id", ownerIds),
      ]);
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      // Build agent map with signed URLs for logos in private bucket
      const agentMap = new Map<string, { agency_name: string | null; agency_logo: string | null }>();
      for (const a of (agentData || [])) {
        let logoUrl: string | null = null;
        if (a.agency_logo) {
          const { data: signedData } = await supabase.storage
            .from("verification-docs")
            .createSignedUrl(a.agency_logo, 3600);
          logoUrl = signedData?.signedUrl || null;
        }
        agentMap.set(a.user_id, { agency_name: a.agency_name, agency_logo: logoUrl });
      }

      const propertiesWithProfiles = propertiesData.map(p => {
        const agent = agentMap.get(p.owner_id);
        return {
          ...p,
          profiles: profilesMap.get(p.owner_id) || null,
          agent_info: agent || null,
        };
      });

      setProperties(propertiesWithProfiles);

      let county = "";
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("county")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profileData?.county) {
          county = profileData.county;
        }
      }

      setUserCounty(county);
      
      if (county) {
        const nearby = propertiesData.filter(p => p.county === county).slice(0, 5);
        setNearMeProperties(nearby);
      } else {
        setNearMeProperties([]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user, typeFilter, listingFilter, statusFilter, countyFilter, minPrice, maxPrice, searchQuery, preferences.default_sort_order, preferences.default_county, preferences.default_listing_type, preferences.default_property_type]);

  const firstTwoProperties = properties.slice(0, 2);
  const remainingProperties = properties.slice(2);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead />
      <Navbar />
      
      <main className="px-4 pt-4 md:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Homepage Banners */}
        <HomepageBanners />

        {/* Featured Promoted Properties */}
        <FeaturedPropertiesBanner />

        {/* Recently Viewed Section */}
        {user && <RecentlyViewed />}
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No properties listed yet. Be the first to upload!
            </p>
          </div>
        ) : (
          <>
            {/* First batch of properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {firstTwoProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Near Me Section */}
            {nearMeProperties.length > 0 && (
              <div className="mt-8">
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

            {/* Remaining properties */}
            {remainingProperties.length > 0 && remainingProperties.length <= 6 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-8">
                {remainingProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}

            {/* Insert Market Analytics after first batch */}
            {remainingProperties.length > 6 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-8">
                  {remainingProperties.slice(0, 6).map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Market Analytics Section */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MarketTrends />
                  <PopularAreas />
                </div>

                {/* Remaining after analytics */}
                {remainingProperties.length > 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-8">
                    {remainingProperties.slice(6).map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
