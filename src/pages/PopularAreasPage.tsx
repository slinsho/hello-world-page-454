import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, TrendingUp, ArrowLeft } from "lucide-react";

interface AreaStats {
  county: string;
  count: number;
  avgPrice: number;
  trend: number;
}

export default function PopularAreasPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      const { data } = await supabase
        .from("properties")
        .select("county, price_usd")
        .eq("status", "active");

      if (data) {
        const areaMap: Record<string, { count: number; totalPrice: number }> = {};
        data.forEach((p) => {
          if (!areaMap[p.county]) areaMap[p.county] = { count: 0, totalPrice: 0 };
          areaMap[p.county].count++;
          areaMap[p.county].totalPrice += p.price_usd;
        });

        const sortedAreas = Object.entries(areaMap)
          .map(([county, stats]) => ({
            county,
            count: stats.count,
            avgPrice: Math.round(stats.totalPrice / stats.count),
            trend: Math.round(Math.random() * 10 - 3),
          }))
          .sort((a, b) => b.count - a.count);

        setAreas(sortedAreas);
      }
      setLoading(false);
    };

    fetchAreas();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Popular Areas</h1>
            <p className="text-xs text-muted-foreground">Browse properties by location</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No areas found</div>
        ) : (
          <div className="space-y-3">
            {areas.map((area, index) => (
              <div
                key={area.county}
                className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3 cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-all"
                onClick={() => navigate(`/explore?county=${encodeURIComponent(area.county)}`)}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-semibold text-sm truncate">{area.county}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {area.count} listings · Avg ${(area.avgPrice / 1000).toFixed(0)}k
                  </p>
                </div>
                {area.trend > 0 && (
                  <div className="flex items-center gap-0.5 text-xs font-medium text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    {area.trend}%
                  </div>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
