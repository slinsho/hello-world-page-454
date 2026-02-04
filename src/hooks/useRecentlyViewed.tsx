import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RecentlyViewedProperty {
  id: string;
  property_id: string;
  viewed_at: string;
  property?: {
    id: string;
    title: string;
    price_usd: number;
    county: string;
    photos: string[];
    listing_type: string;
    property_type: string;
    bedrooms?: number;
    bathrooms?: number;
  };
}

export function useRecentlyViewed() {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentlyViewed();
    } else {
      setRecentlyViewed([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRecentlyViewed = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("recently_viewed")
      .select(`
        id,
        property_id,
        viewed_at,
        properties:property_id (
          id,
          title,
          price_usd,
          county,
          photos,
          listing_type,
          property_type,
          bedrooms,
          bathrooms
        )
      `)
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const formatted = data.map((item: any) => ({
        ...item,
        property: item.properties,
      }));
      setRecentlyViewed(formatted);
    }
    setLoading(false);
  };

  const addToRecentlyViewed = async (propertyId: string) => {
    if (!user) return;

    // Upsert to update viewed_at if already exists
    const { error } = await supabase
      .from("recently_viewed")
      .upsert(
        {
          user_id: user.id,
          property_id: propertyId,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,property_id",
        }
      );

    if (!error) {
      fetchRecentlyViewed();
    }
  };

  const clearRecentlyViewed = async () => {
    if (!user) return;

    await supabase
      .from("recently_viewed")
      .delete()
      .eq("user_id", user.id);

    setRecentlyViewed([]);
  };

  return {
    recentlyViewed,
    loading,
    addToRecentlyViewed,
    clearRecentlyViewed,
    refresh: fetchRecentlyViewed,
  };
}
