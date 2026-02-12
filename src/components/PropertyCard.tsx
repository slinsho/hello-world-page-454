import { Link } from "react-router-dom";
import { Home, Building2, Store, MapPin, Bed, Bath, Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LISTING_TYPE_LABELS, formatLRD, formatWhatsAppLink } from "@/lib/constants";
import { useFavorites } from "@/hooks/useFavorites";

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
    bedrooms?: number;
    bathrooms?: number;
    contact_phone?: string;
    contact_phone_2?: string;
    profiles?: {
      name: string;
    };
  };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(property.id);
  
  const TypeIcon = {
    house: Home,
    apartment: Building2,
    shop: Store,
  }[property.property_type];

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-0 bg-card rounded-2xl">
      <div className="relative h-64 overflow-hidden">
        {property.photos[0] ? (
          <img
            src={property.photos[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <TypeIcon className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* For Sale Badge */}
        <Badge
          className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-lg font-semibold text-xs"
        >
          {LISTING_TYPE_LABELS[property.listing_type]}
        </Badge>
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(property.id);
          }}
        >
          <Heart 
            className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "text-foreground"}`}
          />
        </Button>

        {/* Property Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-4">
          <Link to={`/property/${property.id}`}>
            <div className="space-y-2">
              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{property.address}</span>
              </div>
              
              {/* Title and Price */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-foreground line-clamp-1 flex-1">
                  {property.title}
                </h3>
                <div className="text-right">
                  <span className="font-bold text-lg text-primary whitespace-nowrap">
                    ${property.price_usd.toLocaleString()}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatLRD(property.price_usd)}
                  </span>
                </div>
              </div>
              
              {/* Property Details */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {property.bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-3 w-3" />
                    <span>{property.bedrooms} Bed</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-3 w-3" />
                    <span>{property.bathrooms} Bath</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
          
          {/* Contact Buttons */}
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline"
              className="flex-1 rounded-full border-foreground/20 bg-background/50 hover:bg-background text-foreground font-semibold"
              onClick={(e) => {
                e.preventDefault();
                if (property.contact_phone) {
                  window.location.href = `tel:${property.contact_phone}`;
                } else {
                  window.location.href = `/property/${property.id}`;
                }
              }}
            >
              Contact
            </Button>
            {property.contact_phone && (
              <Button
                size="icon"
                className="rounded-full h-10 w-10 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white"
                onClick={(e) => {
                  e.preventDefault();
                  const msg = `Hi, I'm interested in your property "${property.title}" listed at $${property.price_usd.toLocaleString()} (${formatLRD(property.price_usd)}).`;
                  window.open(formatWhatsAppLink(property.contact_phone!, msg), '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;
