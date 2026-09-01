import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Which hotels can the signed-in user manage?
 *  - Hotel owners  → the hotels they own
 *  - Receptionists → the hotels they are staff of (bookings only)
 */
export function useHotelScope() {
  const { user } = useAuth();
  const [hotelIds, setHotelIds] = useState<string[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setHotelIds([]); setHotels([]); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: owned }, { data: staffRows }] = await Promise.all([
        supabase.from("hotels").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
        (supabase.from("hotel_staff" as any) as any).select("hotel_id").eq("user_id", user.id).eq("is_active", true),
      ]);
      if (cancelled) return;
      const ownedList = owned || [];
      const staffIds: string[] = (staffRows || []).map((r: any) => r.hotel_id);
      let staffHotels: any[] = [];
      if (staffIds.length) {
        const { data } = await supabase.from("hotels").select("*").in("id", staffIds);
        staffHotels = data || [];
      }
      if (cancelled) return;
      const all = [...ownedList, ...staffHotels.filter((h) => !ownedList.some((o: any) => o.id === h.id))];
      setHotels(all);
      setHotelIds(all.map((h: any) => h.id));
      setIsOwner(ownedList.length > 0);
      setIsStaff(staffIds.length > 0 && ownedList.length === 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { hotels, hotelIds, isStaff, isOwner, loading };
}
