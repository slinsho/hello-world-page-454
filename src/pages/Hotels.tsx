import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, ShieldCheck, Search, ArrowLeft, SlidersHorizontal } from "lucide-react";

const Hotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hotels")
        .select("*")
        .eq("status", "active")
        .order("is_verified", { ascending: false })
        .order("star_rating", { ascending: false });
      setHotels(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = hotels.filter((h) =>
    !query ||
    h.name?.toLowerCase().includes(query.toLowerCase()) ||
    h.county?.toLowerCase().includes(query.toLowerCase()) ||
    h.city?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead title="Book Hotels in Liberia" description="Discover verified hotels across Liberia and book your stay." />

      {/* Native-style header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 px-3 pt-3 pb-1">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 grid place-items-center rounded-full hover:bg-muted active:scale-95 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1" />
          </div>
          <div className="px-5 pb-3">
            <h1 className="text-2xl font-bold tracking-tight">Book your stay</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Verified hotels across Liberia</p>
          </div>
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Hotel, city or county"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-11 rounded-2xl bg-muted/60 border-0"
              />
            </div>
            <button
              className="w-11 h-11 rounded-2xl bg-muted/60 grid place-items-center active:scale-95 transition"
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-3">
        <div className="flex items-baseline justify-between px-1 mb-2.5">
          <h2 className="text-sm font-bold tracking-tight">
            {loading ? "Searching…" : `${filtered.length} ${filtered.length === 1 ? "hotel" : "hotels"}`}
          </h2>
          <span className="text-[11px] text-muted-foreground">Verified first</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">No hotels found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((h) => (
              <Link
                key={h.id}
                to={`/hotels/${h.id}`}
                className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border active:scale-[0.99] transition-transform"
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                  {h.cover_photo && (
                    <img src={h.cover_photo} alt={h.name} className="w-full h-full object-cover" loading="lazy" />
                  )}
                  {h.is_verified && (
                    <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-green-600 grid place-items-center shadow">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <h3 className="font-bold text-sm leading-tight truncate">{h.name}</h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {h.city || h.district}, {h.county}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold tabular-nums">
                      {Number(h.star_rating || 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({h.rating_count || 0})
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Hotels;
