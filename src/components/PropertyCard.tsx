import { Link } from "react-router-dom";
import { Home, Building2, Store } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LISTING_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    property_type: "house" | "apartment" | "shop";
    listing_type: "for_sale" | "for_rent" | "for_lease";
    price_usd: number;
    address: string;
    county: string;
    status: "active" | "negotiating" | "taken";
    photos: string[];
    description?: string;
    contact_phone?: string;
    contact_phone_2?: string;
    profiles?: {
      name: string;
    };
  };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const TypeIcon = {
    house: Home,
    apartment: Building2,
    shop: Store,
  }[property.property_type];

  return (
    <Link to={`/property/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative h-48 overflow-hidden bg-muted">
          {property.photos[0] ? (
            <img
              src={property.photos[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <Badge
            className={`absolute top-2 right-2 ${STATUS_COLORS[property.status]}`}
          >
            {STATUS_LABELS[property.status]}
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
            <TypeIcon className="h-5 w-5 text-primary shrink-0" />
          </div>

          {property.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {property.description}
            </p>
          )}

          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-bold text-primary text-xl">
              ${property.price_usd.toLocaleString()}
            </p>
            <p className="line-clamp-1">{property.address}</p>
            <p>{property.county}</p>
            {(property.contact_phone || property.contact_phone_2) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {property.contact_phone && (
                  <span className="text-xs">📞 {property.contact_phone}</span>
                )}
                {property.contact_phone_2 && (
                  <span className="text-xs">📞 {property.contact_phone_2}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <Badge variant="outline">{LISTING_TYPE_LABELS[property.listing_type]}</Badge>
          {property.profiles && (
            <span className="text-sm text-muted-foreground">
              by {property.profiles.name}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PropertyCard;
