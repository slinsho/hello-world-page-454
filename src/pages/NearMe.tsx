import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { FeaturedPropertiesBanner } from "@/components/FeaturedPropertiesBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Settings, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PROPERTY_FILTERS = ["All", "House", "Apartment", "Shop"] as const;
const LISTING_FILTERS = ["All", "For Sale", "For Rent", "For Lease"] as const;

const NearMe = () => {
  const [searchParams] = useSearchParams();
  const urlCounty = searchParams.get("county");
  const { user } = useAuth();
  const [county, setCounty] = useState<string>("");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState<string>("All");
  const [listingFilter, setListingFilter] = useState<string>("All");

  useEffect(() => {
    const fetchUserCountyAndProperties = async () => {
      let targetCounty = urlCounty || "";

      if (!targetCounty && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("county")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.county) {
          targetCounty = profile.county;
        }
      }

      setCounty(targetCounty);

      if (!targetCounty) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .eq("county", targetCounty)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const ownerIds = [...new Set(data.map((p: any) => p.owner_id))];
        if (ownerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, name, role, verification_status, phone, profile_photo_url")
            .in("id", ownerIds);

          // Fetch agent info for agent owners
          const agentIds = (profilesData || []).filter(p => p.role === "agent").map(p => p.id);
          let agentInfoMap = new Map();
          if (agentIds.length > 0) {
            const { data: verifications } = await supabase
              .from("verification_requests")
              .select("user_id, agency_name, agency_logo")
              .in("user_id", agentIds)
              .eq("status", "approved");
            (verifications || []).forEach(v => {
              agentInfoMap.set(v.user_id, { agency_name: v.agency_name, agency_logo: v.agency_logo });
            });
          }

          const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
          setProperties(data.map((p: any) => ({
            ...p,
            profiles: profilesMap.get(p.owner_id) || null,
            agent_info: agentInfoMap.get(p.owner_id) || null,
          })));
        } else {
          setProperties(data);
        }
      }
      setLoading(false);
    };

    fetchUserCountyAndProperties();
  }, [urlCounty, user]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (propertyFilter !== "All" && p.property_type !== propertyFilter.toLowerCase()) return false;
      if (listingFilter !== "All") {
        const mapped = listingFilter.toLowerCase().replace("for ", "for_");
        if (p.listing_type !== mapped) return false;
      }
      return true;
    });
  }, [properties, propertyFilter, listingFilter]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <main className="px-4 pt-4 md:px-6 max-w-5xl mx-auto">
        {/* County Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {county ? `${county} County` : "Near Me"}
              </h1>
              {!loading && county && (
                <p className="text-xs text-muted-foreground">
                  {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"} found
                </p>
              )}
            </div>
          </div>
          {county && (
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground gap-1">
              <Link to="/profile">
                Change <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>

        {/* Filter Chips */}
        {county && !loading && properties.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {/* Property type filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {PROPERTY_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setPropertyFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    propertyFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {/* Listing type filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {LISTING_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setListingFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    listingFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mt-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          ) : !county ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Set your location</h2>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                Add your county in your profile to discover properties near you.
              </p>
              <Button asChild>
                <Link to="/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Profile
                </Link>
              </Button>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">No properties found</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {properties.length > 0
                  ? "Try adjusting your filters to see more results."
                  : `No active listings in ${county} yet. Check back soon!`}
              </p>
              {properties.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => { setPropertyFilter("All"); setListingFilter("All"); }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <FeaturedPropertiesBanner />
        </div>
      </main>
    </div>
  );
};

export default NearMe;
