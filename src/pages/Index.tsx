import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PropertyCard from "@/components/PropertyCard";
import NearMePropertyCard from "@/components/NearMePropertyCard";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [nearMeProperties, setNearMeProperties] = useState<any[]>([]);
  const [userCounty, setUserCounty] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const typeFilter = searchParams.get("type");
  const listingFilter = searchParams.get("listing");
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    const fetchData = async () => {
      // Fetch properties
      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", "active");

      // Apply type filter
      if (typeFilter && typeFilter !== "all") {
        query = query.eq("property_type", typeFilter as "house" | "apartment" | "shop");
      }

      // Apply listing type filter
      if (listingFilter && listingFilter !== "all") {
        query = query.eq("listing_type", listingFilter as "for_sale" | "for_rent" | "for_lease");
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,county.ilike.%${searchQuery}%`);
      }

      const { data: propertiesData, error } = await query.order("created_at", { ascending: false });

      if (error || !propertiesData) {
        setLoading(false);
        return;
      }

      setProperties(propertiesData);

      // Get user's county from profile - only show Near Me for logged in users with county set
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
      
      // Filter properties for "Near Me" section - only if user has a county set
      if (county) {
        const nearby = propertiesData.filter(p => p.county === county).slice(0, 5);
        setNearMeProperties(nearby);
      } else {
        setNearMeProperties([]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user, typeFilter, listingFilter, searchQuery]);

  const firstTwoProperties = properties.slice(0, 2);
  const remainingProperties = properties.slice(2);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="px-4 pt-4 md:px-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
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
            {/* First two properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="space-y-3">
                  {nearMeProperties.map((property) => (
                    <NearMePropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </div>
            )}

            {/* Remaining properties */}
            {remainingProperties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {remainingProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
