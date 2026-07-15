import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Star, MapPin, ShieldCheck, Search, ArrowLeft, SlidersHorizontal,
  Wifi, Snowflake, Tv, Waves, Coffee, Car, Utensils, Dumbbell, Users, BedDouble,
} from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/countyFlags";

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi, ac: Snowflake, tv: Tv, pool: Waves, breakfast: Coffee,
  parking: Car, restaurant: Utensils, gym: Dumbbell,
};

const Hotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [county, setCounty] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "price_low" | "price_high">("rating");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hotels")
        .select("*")
        .eq("status", "active")
        .order("is_verified", { ascending: false })
        .order("star_rating", { ascending: false });
      const hs = data || [];
      setHotels(hs);
      if (hs.length) {
        const ids = hs.map((h: any) => h.id);
        const { data: rs } = await supabase.from("hotel_rooms").select("*").in("hotel_id", ids).eq("is_active", true);
        const grouped: Record<string, any[]> = {};
        (rs || []).forEach((r: any) => { (grouped[r.hotel_id] = grouped[r.hotel_id] || []).push(r); });
        setRooms(grouped);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = hotels.filter((h) => {
      const matchesQuery = !query ||
        h.name?.toLowerCase().includes(query.toLowerCase()) ||
        h.county?.toLowerCase().includes(query.toLowerCase()) ||
        h.city?.toLowerCase().includes(query.toLowerCase());
      const matchesCounty = county === "all" || h.county === county;
      const matchesVerified = !verifiedOnly || h.is_verified;
      return matchesQuery && matchesCounty && matchesVerified;
    });
    const minPrice = (h: any) => {
      const rs = rooms[h.id] || [];
      return rs.length ? Math.min(...rs.map((r: any) => Number(r.price_per_night) || Infinity)) : Infinity;
    };
    if (sortBy === "rating") list = [...list].sort((a, b) => Number(b.star_rating || 0) - Number(a.star_rating || 0));
    if (sortBy === "price_low") list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
    if (sortBy === "price_high") list = [...list].sort((a, b) => minPrice(b) - minPrice(a));
    return list;
  }, [hotels, rooms, query, county, verifiedOnly, sortBy]);

  const activeFilters = (county !== "all" ? 1 : 0) + (verifiedOnly ? 1 : 0) + (sortBy !== "rating" ? 1 : 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead title="Book Hotels in Liberia" description="Discover verified hotels across Liberia and book your stay." />

      {/* Compact native-style header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-2xl mx-auto px-3 pt-2.5 pb-2.5">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted active:scale-95 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-bold tracking-tight leading-tight truncate">Book your stay</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Verified hotels across Liberia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Hotel, city or county"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 rounded-full bg-muted/60 border-0 text-sm"
              />
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button
                  className="relative w-10 h-10 rounded-full bg-muted/60 grid place-items-center active:scale-95 transition"
                  aria-label="Filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFilters > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-bold">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader className="pb-3">
                  <SheetTitle>Filter hotels</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">County</Label>
                    <Select value={county} onValueChange={setCounty}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All counties</SelectItem>
                        {LIBERIA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Sort by</Label>
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Top rated</SelectItem>
                        <SelectItem value="price_low">Price: low to high</SelectItem>
                        <SelectItem value="price_high">Price: high to low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer">
                    <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Verified hotels only</p>
                      <p className="text-[11px] text-muted-foreground">Show only hotels we've verified</p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  </label>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setCounty("all"); setVerifiedOnly(false); setSortBy("rating"); }}>Reset</Button>
                    <Button className="flex-1 rounded-xl" onClick={() => setFilterOpen(false)}>Apply</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-3 pt-3">
        <div className="flex items-baseline justify-between px-1 mb-2.5">
          <h2 className="text-xs font-bold tracking-tight">
            {loading ? "Searching…" : `${filtered.length} ${filtered.length === 1 ? "hotel" : "hotels"}`}
          </h2>
          <span className="text-[10px] text-muted-foreground">Verified first</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">No hotels found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((h) => {
              const rs = rooms[h.id] || [];
              const minPrice = rs.length ? Math.min(...rs.map((r: any) => Number(r.price_per_night))) : null;
              const maxGuests = rs.length ? Math.max(...rs.map((r: any) => Number(r.guests || 0))) : 0;
              const bedTypes = Array.from(new Set(rs.map((r: any) => r.bed_type).filter(Boolean)));
              const amen = h.amenities || {};
              const topAmen: string[] = Array.isArray(h.top_amenities) && h.top_amenities.length
                ? h.top_amenities as string[]
                : Object.keys(amen).filter((k) => amen[k]);
              const shownAmen = topAmen.slice(0, 4);
              return (
                <Link
                  key={h.id}
                  to={`/hotels/${h.id}`}
                  className="block rounded-2xl bg-card border border-border overflow-hidden active:scale-[0.99] transition-transform shadow-sm"
                >
                  <div className="relative h-40 bg-muted">
                    {h.cover_photo && (
                      <img src={h.cover_photo} alt={h.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    {h.is_verified && (
                      <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow">
                        <ShieldCheck className="w-3 h-3" />Verified
                      </span>
                    )}
                    {minPrice != null && (
                      <span className="absolute top-2 right-2 bg-background/95 backdrop-blur text-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                        from <span className="text-primary">${minPrice}</span>/night
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[15px] leading-tight truncate">{h.name}</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />{h.city || h.district}, {h.county}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold tabular-nums">{Number(h.star_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>

                    {(maxGuests > 0 || bedTypes.length > 0) && (
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        {maxGuests > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />Up to {maxGuests}
                          </span>
                        )}
                        {bedTypes[0] && (
                          <span className="flex items-center gap-1 capitalize">
                            <BedDouble className="w-3 h-3" />{bedTypes[0].split("_").join(" ")}
                          </span>
                        )}
                      </div>
                    )}

                    {shownAmen.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {shownAmen.map((k) => {
                          const Icon = AMENITY_ICONS[k] || Star;
                          return (
                            <span key={k} className="flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize">
                              <Icon className="w-3 h-3 text-primary" />{k.split("_").join(" ")}
                            </span>
                          );
                        })}
                        {topAmen.length > shownAmen.length && (
                          <span className="text-[10px] text-muted-foreground">+{topAmen.length - shownAmen.length}</span>
                        )}
                      </div>
                    )}

                    {Array.isArray(h.why_guests_love) && h.why_guests_love.length > 0 && (
                      <div className="mt-2 flex items-start gap-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg px-2 py-1.5">
                        <span className="text-[10px]">❤️</span>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-tight line-clamp-1">
                          {(h.why_guests_love as string[]).slice(0, 2).join(" · ")}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Hotels;
