import { Link } from "react-router-dom";
import { Heart, Home, Building2, Store } from "lucide-react";
import { useState } from "react";

interface NearMePropertyCardProps {
  property: {
    id: string;
    title: string;
    property_type: string;
    listing_type: string;
    price_usd: number;
    address: string;
    bedrooms?: number;
    bathrooms?: number;
    photos: string[];
  };
}

const NearMePropertyCard = ({ property }: NearMePropertyCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const getPropertyIcon = () => {
    switch (property.property_type) {
      case "house":
        return <Home className="w-4 h-4" />;
      case "apartment":
        return <Building2 className="w-4 h-4" />;
      case "shop":
        return <Store className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const formatListingType = (type: string) => {
    return type.replace("for_", "For ").replace("_", " ");
  };

  const formatPropertyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Link to={`/property/${property.id}`}>
      <div className="bg-card rounded-xl overflow-hidden border border-border flex h-32">
        {/* Image */}
        <div className="w-36 h-full flex-shrink-0">
          {property.photos && property.photos.length > 0 ? (
            <img
              src={property.photos[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              {getPropertyIcon()}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">
              ${property.price_usd.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {property.address}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {property.bedrooms || 0} bds | {property.bathrooms || 0} baths
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                {formatPropertyType(property.property_type)} {formatListingType(property.listing_type)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? "fill-primary text-primary" : "text-primary"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NearMePropertyCard;
