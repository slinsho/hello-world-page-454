import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, ShieldCheck, Search } from "lucide-react";

const Hotels = () => {
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title="Book Hotels in Liberia | L-Prop" description="Discover verified hotels across Liberia and book your stay with confidence." />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Book Your Stay</h1>
          <p className="text-muted-foreground text-sm">Verified hotels across Liberia</p>
        </div>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search hotels, city, county..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 h-12 rounded-xl" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No hotels available yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((h) => (
              <Link key={h.id} to={`/hotels/${h.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative aspect-[16/10] bg-muted">
                    {h.cover_photo && <img src={h.cover_photo} alt={h.name} className="w-full h-full object-cover" loading="lazy" />}
                    {h.is_verified && (
                      <Badge className="absolute top-2 left-2 bg-green-600 text-white gap-1"><ShieldCheck className="w-3 h-3" />Verified Hotel</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-base truncate">{h.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{h.city || h.district}, {h.county}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">{Number(h.star_rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({h.rating_count || 0} reviews)</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Hotels;
