import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import NearMePropertyCard from "@/components/NearMePropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

const NearMe = () => {
  const [searchParams] = useSearchParams();
  const county = searchParams.get("county") || "";
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!county) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .eq("county", county)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProperties(data);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [county]);

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
      </main>
    </div>
  );
};

export default NearMe;
