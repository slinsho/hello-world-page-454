import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserPreferences {
  show_phone: boolean;
  show_email: boolean;
  show_location: boolean;
  default_county: string | null;
  currency_display: "usd" | "lrd";
  default_listing_type: string | null;
  default_property_type: string | null;
  default_sort_order: string;
}

const defaultPrefs: UserPreferences = {
  show_phone: true,
  show_email: true,
  show_location: true,
  default_county: null,
  currency_display: "usd",
  default_listing_type: null,
  default_property_type: null,
  default_sort_order: "newest",
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreference: (key: keyof UserPreferences, value: any) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: defaultPrefs,
  loading: true,
  updatePreference: async () => {},
});

export const UserPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [hasRecord, setHasRecord] = useState(false);

  useEffect(() => {
    if (!user) {
      setPreferences(defaultPrefs);
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("user_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const d = data as any;
        setPreferences({
          show_phone: d.show_phone ?? true,
          show_email: d.show_email ?? true,
          show_location: d.show_location ?? true,
          default_county: d.default_county || null,
          currency_display: d.currency_display || "usd",
        });
        setHasRecord(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const updatePreference = useCallback(async (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    if (!user) return;

    if (hasRecord) {
      await supabase
        .from("user_preferences" as any)
        .update({ [key]: value, updated_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_preferences" as any)
        .insert({ user_id: user.id, [key]: value } as any);
      setHasRecord(true);
    }
  }, [user, hasRecord]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, loading, updatePreference }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => useContext(UserPreferencesContext);

// Helper to fetch another user's privacy settings (for property detail / profile pages)
export async function fetchUserPrivacySettings(userId: string): Promise<{ show_phone: boolean; show_email: boolean; show_location: boolean }> {
  const { data } = await supabase
    .from("user_preferences" as any)
    .select("show_phone, show_email, show_location")
    .eq("user_id", userId)
    .single();

  if (data) {
    const d = data as any;
    return {
      show_phone: d.show_phone ?? true,
      show_email: d.show_email ?? true,
      show_location: d.show_location ?? true,
    };
  }
  return { show_phone: true, show_email: true, show_location: true };
}
