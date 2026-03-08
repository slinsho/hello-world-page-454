import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import NearMePropertyCard from "@/components/NearMePropertyCard";
import { FeaturedPropertiesBanner } from "@/components/FeaturedPropertiesBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const NearMe = () => {
  const [searchParams] = useSearchParams();
  const urlCounty = searchParams.get("county");
  const { user } = useAuth();
  const [county, setCounty] = useState<string>("");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCountyAndProperties = async () => {
      let targetCounty = urlCounty || "";

      // If no county in URL, try to get from user profile
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
        // Fetch owner profiles for verification badges
        const ownerIds = [...new Set(data.map((p: any) => p.owner_id))];
        if (ownerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, name, role, verification_status, phone, profile_photo_url")
            .in("id", ownerIds);
          const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
          setProperties(data.map((p: any) => ({ ...p, profiles: profilesMap.get(p.owner_id) || null })));
        } else {
          setProperties(data);
        }
      }
      setLoading(false);
    };

    fetchUserCountyAndProperties();
  }, [urlCounty, user]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <main className="px-4 pt-4 md:px-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Properties in {county}
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : !county ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Set your county in your profile to see properties near you.
            </p>
            <Button asChild>
              <Link to="/profile">
                <Settings className="h-4 w-4 mr-2" />
                Go to Profile
              </Link>
            </Button>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No properties found in {county}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <NearMePropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        <FeaturedPropertiesBanner />
      </main>
    </div>
  );
};

export default NearMe;
