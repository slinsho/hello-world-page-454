import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight } from "lucide-react";
import { useFormatLRD } from "@/hooks/usePlatformSettings";

interface FeaturedProperty {
  id: string;
  title: string;
  price_usd: number;
  county: string;
  photos: string[];
  property_type: string;
  listing_type: string;
}

export function FeaturedPropertiesBanner() {
  const [properties, setProperties] = useState<FeaturedProperty[]>([]);
  const formatLRD = useFormatLRD();

  useEffect(() => {
    const fetchPromoted = async () => {
      // Use round-robin RPC: returns least-shown promoted properties and increments their counts
      const { data } = await supabase.rpc("get_round_robin_promoted", { limit_count: 10 });
      if (data) {
        setProperties(
          data.map((p: any) => ({
            id: p.id,
            title: p.title,
            price_usd: p.price_usd,
            county: p.county,
            photos: p.photos,
            property_type: p.property_type,
            listing_type: p.listing_type,
          }))
        );
      }
    };
    fetchPromoted();
  }, []);

  if (properties.length === 0) return null;

  return (
    <div className="my-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Featured Listings</h3>
        </div>
        <Link to="/featured" className="flex items-center gap-0.5 text-xs text-primary font-medium">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {properties.map((p) => (
          <Link
            key={p.id}
            to={`/property/${p.id}`}
            className="flex-shrink-0 w-56 snap-start group"
          >
            <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-32">
                <img
                  src={p.photos?.[0] || "/placeholder.svg"}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Featured
                </Badge>
              </div>
              <div className="p-2.5">
                <p className="text-sm font-semibold text-foreground line-clamp-1">{p.title}</p>
                <p className="text-xs text-primary font-bold">${p.price_usd.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{formatLRD(p.price_usd)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.county}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
