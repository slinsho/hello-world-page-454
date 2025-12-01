import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Favorite {
  id: string;
  property_id: string;
  created_at: string;
  property: {
    id: string;
    title: string;
    photos: string[];
    price_usd: number;
    county: string;
    address: string;
    property_type: string;
    listing_type: string;
    bedrooms: number | null;
    bathrooms: number | null;
  };
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          *,
          property:properties(id, title, photos, price_usd, county, address, property_type, listing_type, bedrooms, bathrooms)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await supabase.from("favorites").delete().eq("id", id);
      setFavorites(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Removed from favorites",
        description: "Property has been removed from your favorites",
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatListingType = (type: string) => {
    return type.replace("for_", "For ").replace("_", " ");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <h1 className="text-xl font-bold">My Favorites</h1>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No favorites yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the heart icon on properties to save them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <Card
                key={favorite.id}
                className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/property/${favorite.property.id}`)}
              >
                <div className="flex gap-3 p-3">
                  <img
                    src={favorite.property.photos[0]}
                    alt={favorite.property.title}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {favorite.property.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {favorite.property.address}, {favorite.property.county}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(favorite.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-primary font-bold text-sm">
                        {formatPrice(favorite.property.price_usd)}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {formatListingType(favorite.property.listing_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="capitalize">{favorite.property.property_type}</span>
                      {favorite.property.bedrooms && (
                        <span>{favorite.property.bedrooms} bed</span>
                      )}
                      {favorite.property.bathrooms && (
                        <span>{favorite.property.bathrooms} bath</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
