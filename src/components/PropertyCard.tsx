import { memo } from "react";
import { Link } from "react-router-dom";
import { Home, Building2, Store, Trees, MapPin, Heart, MessageCircle, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
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
  /** Render the expanded hero-style card with owner bar and overlay details. */
  variant?: "default" | "featured";
}

const PropertyCard = ({ property, priority = false, variant = "featured" }: PropertyCardProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const formatLRD = useFormatLRD();
  const { preferences } = useUserPreferences();
  const showLRD = preferences.currency_display === "lrd";
  const favorited = isFavorite(property.id);
  const isFeatured = variant === "featured";

  const displayName = property.agent_info?.agency_name || property.profiles?.name || "Owner";
  const displayPhoto = property.agent_info?.agency_logo || property.profiles?.profile_photo_url;
  const isVerified = property.profiles?.verification_status === "approved";
  const isAgent = property.profiles?.role === "agent";

  const TypeIcon = {
    house: Home,
    apartment: Building2,
    shop: Store,
    land: Trees,
  }[property.property_type];

  const listingLabel = (LISTING_TYPE_LABELS[property.listing_type] || "For Sale").toUpperCase();
  const priceLabel = showLRD ? formatLRD(property.price_usd) : `$${property.price_usd.toLocaleString()}`;
  const secondaryPrice = showLRD ? `$${property.price_usd.toLocaleString()}` : formatLRD(property.price_usd);

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-0 bg-card rounded-2xl">
      <div className={`relative overflow-hidden ${isFeatured ? "h-60 md:h-72" : "h-48"}`}>
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

        {/* Top-left badges cluster */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isFeatured && (property as any).is_promoted ? (
            <>
              <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold text-xs uppercase gap-1 shadow-md">
                <Sparkles className="h-3 w-3" />Featured
              </Badge>
              <span className="text-xs font-bold uppercase text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                {listingLabel}
              </span>
            </>
          ) : (
            <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold text-xs uppercase shadow-md">
              {listingLabel}
            </Badge>
          )}
        </div>

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
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 hover:bg-background shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(property.id);
          }}
        >
          <Heart
            className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "text-foreground"}`}
          />
        </Button>

        {/* Price badge (default variant) */}
        {!isFeatured && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
              {priceLabel}
            </Badge>
          </div>
        )}

        {/* Featured overlay info */}
        {isFeatured && (
          <div className="featured-card-overlay absolute bottom-0 left-0 right-0 p-4">
            <Link to={`/property/${property.id}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-white/90">
                  {countyFlag(property.county) ? (
                    <img
                      src={countyFlag(property.county)}
                      alt={property.county}
                      className="h-3 w-4 object-cover rounded-[2px] shrink-0 ring-1 ring-white/30"
                      loading="lazy"
                    />
                  ) : (
                    <MapPin className="h-3 w-3" />
                  )}
                  <span className="line-clamp-1">{property.address}</span>
                </div>
                <h3 className="featured-card-title font-bold text-lg text-white line-clamp-1">
                  {property.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground px-2.5 py-1 rounded-md font-bold text-sm shadow-md">
                    {priceLabel}
                  </Badge>
                  <span className="text-xs text-white/90">≈ {secondaryPrice}</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Default variant bottom content */}
      {!isFeatured && (
        <Link to={`/property/${property.id}`}>
          <div className="p-3">
            <h3 className="font-bold text-base text-foreground line-clamp-1">
              {property.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              {countyFlag(property.county) ? (
                <img
                  src={countyFlag(property.county)}
                  alt={property.county}
                  className="h-3 w-4 object-cover rounded-[2px] shrink-0"
                  loading="lazy"
                />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
              <span className="line-clamp-1">{property.county}</span>
            </div>
          </div>
        </Link>
      )}

      {/* Featured variant owner bar */}
      {isFeatured && (
        <div className="p-3 flex items-center justify-between border-t border-border gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-9 w-9 border border-border shrink-0">
              <AvatarImage src={displayPhoto || undefined} className="object-cover" />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {isVerified && (
                  <>
                    <ShieldCheck className={`h-3 w-3 ${isAgent ? "text-blue-500" : "text-green-500"}`} />
                    <span className={`text-[10px] font-semibold ${isAgent ? "text-blue-500" : "text-green-500"}`}>
                      {isAgent ? "Verified Agent" : "Verified Owner"}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            </div>
          </div>
          {property.contact_phone && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2 bg-background border-border text-foreground hover:bg-muted shrink-0"
              onClick={(e) => {
                e.preventDefault();
                const msg = `Hi, I'm interested in your property "${property.title}" listed at $${property.price_usd.toLocaleString()} (${formatLRD(property.price_usd)}).`;
                window.open(formatWhatsAppLink(property.contact_phone!, msg), "_blank");
              }}
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span className="hidden sm:inline">Message on WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default memo(PropertyCard, (prev, next) =>
  prev.property.id === next.property.id &&
  prev.property.status === next.property.status &&
  prev.property.price_usd === next.property.price_usd &&
  prev.property.photos[0] === next.property.photos[0] &&
  prev.priority === next.priority &&
  prev.variant === next.variant
);
