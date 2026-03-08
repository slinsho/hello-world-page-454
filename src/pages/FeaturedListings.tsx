import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const FeaturedListings = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_promoted", true)
        .eq("status", "active")
        .order("updated_at", { ascending: false });

      if (!error && data) {
        const ownerIds = [...new Set(data.map((p: any) => p.owner_id))];
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, role, verification_status, phone, profile_photo_url")
            .in("id", ownerIds);
          const map = new Map((profiles || []).map((p) => [p.id, p]));
          setProperties(data.map((p: any) => ({ ...p, profiles: map.get(p.owner_id) || null })));
        } else {
          setProperties(data);
        }
      }
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title="Featured Listings | JEEK Properties" description="Browse our featured and promoted property listings." />
      <Navbar />

      <main className="px-4 pt-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Featured Listings</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No featured listings at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FeaturedListings;
