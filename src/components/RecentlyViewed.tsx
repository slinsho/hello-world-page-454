import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, X, ChevronRight } from "lucide-react";
import { LISTING_TYPE_LABELS } from "@/lib/constants";

export function RecentlyViewed() {
  const { recentlyViewed, loading, clearRecentlyViewed } = useRecentlyViewed();

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-48 flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (recentlyViewed.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Recently Viewed</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs"
          onClick={clearRecentlyViewed}
        >
          Clear All
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recentlyViewed.slice(0, 10).map((item) => (
          <Link
            key={item.id}
            to={`/property/${item.property_id}`}
            className="flex-shrink-0"
          >
            <Card className="w-48 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="relative h-20 rounded-t-lg overflow-hidden">
                  {item.property?.photos?.[0] ? (
                    <img
                      src={item.property.photos[0]}
                      alt={item.property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-primary/90 text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                    ${item.property?.price_usd?.toLocaleString()}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium line-clamp-1">
                    {item.property?.title || "Property"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.property?.county}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
