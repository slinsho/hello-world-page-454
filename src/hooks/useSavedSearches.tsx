import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface SearchFilters {
  type?: string;
  listing?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  county?: string;
  bedrooms?: string;
  bathrooms?: string;
  searchQuery?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  notify_new_matches: boolean;
  created_at: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedSearches();
    } else {
      setSavedSearches([]);
      setLoading(false);
    }
  }, [user]);

  const fetchSavedSearches = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedSearches(data.map((s: any) => ({
        ...s,
        filters: s.filters as SearchFilters,
      })));
    }
    setLoading(false);
  };

  const saveSearch = async (name: string, filters: SearchFilters, notifyNewMatches: boolean = false) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save searches",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        name,
        filters: filters as any,
        notify_new_matches: notifyNewMatches,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Search Saved",
      description: `"${name}" has been saved`,
    });

    fetchSavedSearches();
    return data;
  };

  const deleteSearch = async (searchId: string) => {
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", searchId);

    if (!error) {
      setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
      toast({
        title: "Search Deleted",
        description: "Your saved search has been removed",
      });
    }
  };

  const toggleNotifications = async (searchId: string, enabled: boolean) => {
    const { error } = await supabase
      .from("saved_searches")
      .update({ notify_new_matches: enabled })
      .eq("id", searchId);

    if (!error) {
      setSavedSearches((prev) =>
        prev.map((s) =>
          s.id === searchId ? { ...s, notify_new_matches: enabled } : s
        )
      );
    }
  };

  return {
    savedSearches,
    loading,
    saveSearch,
    deleteSearch,
    toggleNotifications,
    refresh: fetchSavedSearches,
  };
}
