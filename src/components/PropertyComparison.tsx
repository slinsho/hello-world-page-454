import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CompareProperty } from "@/hooks/usePropertyComparison";
import { X, GitCompare, Bed, Bath, Grid3X3, MapPin, DollarSign } from "lucide-react";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { Link } from "react-router-dom";

interface PropertyComparisonProps {
  compareList: CompareProperty[];
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

export function PropertyComparison({ compareList, removeFromCompare, clearCompare }: PropertyComparisonProps) {
  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-50">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-2 shadow-lg">
            <GitCompare className="h-4 w-4" />
            Compare ({compareList.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Compare Properties</DialogTitle>
              <Button variant="ghost" size="sm" onClick={clearCompare}>
                Clear All
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {compareList.map((property) => (
                <div
                  key={property.id}
                  className="min-w-[280px] max-w-[280px] border rounded-lg overflow-hidden bg-card"
                >
                  {/* Property Image */}
                  <div className="relative h-40">
                    {property.photos?.[0] ? (
                      <img
                        src={property.photos[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Grid3X3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => removeFromCompare(property.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Badge className="absolute bottom-2 left-2 text-xs">
                      {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
                    </Badge>
                  </div>

                  {/* Property Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold line-clamp-1">{property.title}</h4>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{property.county}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <DollarSign className="h-4 w-4" />
                      {property.price_usd.toLocaleString()}
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex flex-col items-center p-2 bg-muted rounded">
                        <Bed className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span>{property.bedrooms || "-"}</span>
                        <span className="text-xs text-muted-foreground">Beds</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted rounded">
                        <Bath className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span>{property.bathrooms || "-"}</span>
                        <span className="text-xs text-muted-foreground">Baths</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted rounded">
                        <Grid3X3 className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span className="capitalize text-xs">{property.property_type}</span>
                      </div>
                    </div>

                    {/* Square Yards */}
                    {property.square_yards && (
                      <div className="text-sm text-muted-foreground">
                        Area: {property.square_yards.toLocaleString()} sq yards
                      </div>
                    )}

                    {/* View Button */}
                    <Link to={`/property/${property.id}`}>
                      <Button variant="outline" className="w-full mt-2">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
