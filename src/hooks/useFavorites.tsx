import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("property_id");

      if (error) throw error;
      setFavoriteIds(new Set(data?.map(f => f.property_id) || []));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const toggleFavorite = useCallback(async (propertyId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const isFavorited = favoriteIds.has(propertyId);

    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("property_id", propertyId)
          .eq("user_id", user.id);

        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });

        toast({
          title: "Removed from favorites",
        });
      } else {
        await supabase
          .from("favorites")
          .insert({ property_id: propertyId, user_id: user.id });

        setFavoriteIds(prev => new Set([...prev, propertyId]));

        toast({
          title: "Added to favorites",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, favoriteIds, toast]);

  const isFavorite = useCallback((propertyId: string) => {
    return favoriteIds.has(propertyId);
  }, [favoriteIds]);

  return { toggleFavorite, isFavorite, loading };
};
