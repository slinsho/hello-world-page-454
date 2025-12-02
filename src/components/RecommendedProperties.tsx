import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { LISTING_TYPE_LABELS } from "@/lib/constants";

interface Property {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price_usd: number;
  county: string;
  photos: string[];
}

interface RecommendedPropertiesProps {
  currentPropertyId: string;
  county: string;
  propertyType: string;
}

const RecommendedProperties = ({ currentPropertyId, county, propertyType }: RecommendedPropertiesProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      // Fetch properties from same county or same type, excluding current property
      const { data } = await supabase
        .from("properties")
        .select("id, title, property_type, listing_type, price_usd, county, photos")
        .eq("status", "active")
        .neq("id", currentPropertyId)
        .or(`county.eq.${county},property_type.eq.${propertyType}`)
        .limit(6);

      if (data) {
        setProperties(data);
      }
      setLoading(false);
    };

    fetchRecommended();
  }, [currentPropertyId, county, propertyType]);

  if (loading || properties.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Recommended</h3>
      <div className="grid grid-cols-2 gap-3">
        {properties.map((property) => (
          <Link key={property.id} to={`/property/${property.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-28">
                {property.photos[0] ? (
                  <img
                    src={property.photos[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground">
                  {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
                </Badge>
              </div>
              <CardContent className="p-2">
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {property.county}
                </p>
                <h4 className="font-semibold text-sm line-clamp-1">{property.title}</h4>
                <p className="text-primary font-bold text-sm mt-1">
                  ${property.price_usd.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProperties;
