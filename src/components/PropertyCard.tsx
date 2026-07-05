import { memo } from "react";
import { Link } from "react-router-dom";
import { Home, Building2, Store, Trees, MapPin, Bed, Bath, Heart, MessageCircle, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LISTING_TYPE_LABELS, formatWhatsAppLink } from "@/lib/constants";
import { useFormatLRD } from "@/hooks/usePlatformSettings";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { countyFlag } from "@/lib/countyFlags";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    property_type: "house" | "apartment" | "shop" | "land";
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
        role?: string;
        verification_status?: string;
        phone?: string;
        profile_photo_url?: string;
      };
      agent_info?: {
        agency_name?: string | null;
        agency_logo?: string | null;
      } | null;
    };
  /** When true, this card is above-the-fold and should load eagerly. */
  priority?: boolean;
}

const PropertyCard = ({ property, priority = false }: PropertyCardProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const formatLRD = useFormatLRD();
  const { preferences } = useUserPreferences();
  const showLRD = preferences.currency_display === "lrd";
  const favorited = isFavorite(property.id);
  
  const TypeIcon = {
    house: Home,
    apartment: Building2,
    shop: Store,
    land: Trees,
  }[property.property_type];

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-0 bg-card rounded-2xl">
      <div className="relative h-64 overflow-hidden">
        {property.photos[0] ? (
          <img
            src={property.photos[0]}
            alt={property.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error - fetchpriority is a valid HTML attr not yet in React types
            fetchpriority={priority ? "high" : "low"}
            width={640}
            height={420}
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

        {/* Featured Badge */}
        {(property as any).is_promoted && (
          <Badge className="absolute top-3 left-24 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-lg text-[10px] gap-1">
            <Sparkles className="h-3 w-3" />Featured
          </Badge>
        )}

        {/* Flagged Badge */}
        {(property as any).is_flagged && (
          <Badge className="absolute top-12 left-3 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-lg text-[10px] gap-1">
            <AlertTriangle className="h-3 w-3" />Flagged
          </Badge>
        )}
        
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
        <div className="property-card-overlay absolute bottom-0 left-0 right-0 p-4">
          <Link to={`/property/${property.id}`}>
            <div className="space-y-2">
              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                {countyFlag(property.county) ? (
                  <img
                    src={countyFlag(property.county)}
                    alt={property.county}
                    className="h-3 w-4 object-cover rounded-[2px] shrink-0 ring-1 ring-black/10"
                    loading="lazy"
                  />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                <span className="line-clamp-1">{property.address}</span>
              </div>
              
              {/* Title and Price */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-foreground line-clamp-1 flex-1">
                  {property.title}
                </h3>
                <div className="text-right">
                  <span className="font-bold text-lg text-primary whitespace-nowrap">
                    {showLRD ? formatLRD(property.price_usd) : `$${property.price_usd.toLocaleString()}`}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {showLRD ? `$${property.price_usd.toLocaleString()}` : formatLRD(property.price_usd)}
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

              {/* Verified Badge */}
              {property.profiles?.verification_status === "approved" && (
                <div className="flex items-center gap-1 mt-1">
                  <ShieldCheck className={`h-3.5 w-3.5 ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`} />
                  <span className={`text-[10px] font-semibold ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`}>
                    {property.profiles?.role === "agent" ? "Verified Agent" : "Verified Owner"}
                  </span>
                  {property.profiles?.phone && (
                    <span className="text-[10px] text-muted-foreground ml-1">· {property.profiles.phone}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
          
          {/* Owner Profile Photo + WhatsApp */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage 
                  src={property.agent_info?.agency_logo || property.profiles?.profile_photo_url || undefined} 
                  className="object-cover" 
                />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {(property.agent_info?.agency_name || property.profiles?.name)?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {property.agent_info?.agency_name || property.profiles?.name || "Owner"}
              </span>
            </div>
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

export default memo(PropertyCard, (prev, next) =>
  prev.property.id === next.property.id &&
  prev.property.status === next.property.status &&
  prev.property.price_usd === next.property.price_usd &&
  prev.property.photos[0] === next.property.photos[0] &&
  prev.priority === next.priority
);
