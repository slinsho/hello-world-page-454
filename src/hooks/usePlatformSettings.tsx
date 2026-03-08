import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformSettings {
  usd_to_lrd_rate: number;
  promotion_price_per_month: number;
  owner_verification_fee_lrd: number;
  agent_verification_fee_usd: number;
  verification_duration_days: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  usd_to_lrd_rate: 192,
  promotion_price_per_month: 5,
  owner_verification_fee_lrd: 500,
  agent_verification_fee_usd: 20,
  verification_duration_days: 5,
};

const PlatformSettingsContext = createContext<{
  settings: PlatformSettings;
  loading: boolean;
}>({ settings: DEFAULT_SETTINGS, loading: true });

export const PlatformSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("platform_settings" as any)
        .select("key, value");
      if (data) {
        const map = new Map((data as any[]).map((d: any) => [d.key, d.value]));
        setSettings({
          usd_to_lrd_rate: Number(map.get("usd_to_lrd_rate")) || DEFAULT_SETTINGS.usd_to_lrd_rate,
          promotion_price_per_month: Number(map.get("promotion_price_per_month")) || DEFAULT_SETTINGS.promotion_price_per_month,
          owner_verification_fee_lrd: Number(map.get("owner_verification_fee_lrd")) || DEFAULT_SETTINGS.owner_verification_fee_lrd,
          agent_verification_fee_usd: Number(map.get("agent_verification_fee_usd")) || DEFAULT_SETTINGS.agent_verification_fee_usd,
          verification_duration_days: Number(map.get("verification_duration_days")) || DEFAULT_SETTINGS.verification_duration_days,
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  return (
    <PlatformSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext);
}

export function formatLRDDynamic(usd: number, rate: number) {
  const lrd = usd * rate;
  return `L$${lrd.toLocaleString()}`;
}

export function useFormatLRD() {
  const { settings } = usePlatformSettings();
  return (usd: number) => formatLRDDynamic(usd, settings.usd_to_lrd_rate);
}
