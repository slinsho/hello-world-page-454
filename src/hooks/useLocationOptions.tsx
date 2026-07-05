import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LocationOptions {
  districts: string[];
  cities: string[];
  communities: string[];
  loading: boolean;
}

// Fetches distinct district/city/community values from properties,
// optionally scoped by county/district/city so dropdowns cascade.
export function useLocationOptions(opts: { county?: string; district?: string; city?: string } = {}): LocationOptions {
  const { county, district, city } = opts;
  const [state, setState] = useState<LocationOptions>({ districts: [], cities: [], communities: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let query = supabase.from("properties").select("district, city, community, county").eq("status", "active").limit(2000);
      if (county && county !== "all") query = query.eq("county", county);
      const { data } = await query;
      if (cancelled || !data) { setState({ districts: [], cities: [], communities: [], loading: false }); return; }
      const districts = new Set<string>();
      const cities = new Set<string>();
      const communities = new Set<string>();
      for (const row of data as any[]) {
        if (row.district) districts.add(row.district);
        if ((!district || district === "all" || row.district === district) && row.city) cities.add(row.city);
        if ((!district || district === "all" || row.district === district) &&
            (!city || city === "all" || row.city === city) && row.community) communities.add(row.community);
      }
      setState({
        districts: Array.from(districts).sort(),
        cities: Array.from(cities).sort(),
        communities: Array.from(communities).sort(),
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, [county, district, city]);

  return state;
}
