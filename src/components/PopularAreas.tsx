 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { MapPin, ChevronRight, TrendingUp } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 interface AreaStats {
   county: string;
   count: number;
   avgPrice: number;
   trend: number;
 }
 
 export default function PopularAreas() {
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
           if (!areaMap[p.county]) {
             areaMap[p.county] = { count: 0, totalPrice: 0 };
           }
           areaMap[p.county].count++;
           areaMap[p.county].totalPrice += p.price_usd;
         });
 
         const sortedAreas = Object.entries(areaMap)
           .map(([county, stats]) => ({
             county,
             count: stats.count,
             avgPrice: Math.round(stats.totalPrice / stats.count),
             trend: Math.round(Math.random() * 10 - 3), // Mock trend
           }))
           .sort((a, b) => b.count - a.count)
           .slice(0, 5);
 
         setAreas(sortedAreas);
       }
       setLoading(false);
     };
 
     fetchAreas();
   }, []);
 
   if (loading) {
     return (
       <div className="mb-6">
         <div className="h-6 w-32 bg-muted rounded animate-pulse mb-3" />
         <div className="space-y-2">
           {[1, 2, 3].map((i) => (
             <div key={i} className="h-16 bg-card rounded-xl animate-pulse border border-border" />
           ))}
         </div>
       </div>
     );
   }
 
   if (areas.length === 0) return null;
 
   return (
     <div className="mb-6">
       <div className="flex items-center justify-between mb-3">
         <h2 className="text-lg font-bold">Popular Areas</h2>
         <Button 
           variant="ghost" 
           size="sm" 
           className="text-primary text-xs gap-1 h-8"
           onClick={() => navigate("/explore")}
         >
           See All <ChevronRight className="h-3 w-3" />
         </Button>
       </div>
 
       <div className="space-y-2">
         {areas.map((area, index) => (
           <div
             key={area.county}
             className="bg-card rounded-xl p-3 border border-border flex items-center gap-3 cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-all"
             onClick={() => navigate(`/explore?county=${encodeURIComponent(area.county)}`)}
           >
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <span className="text-sm font-bold text-primary">#{index + 1}</span>
             </div>
             
             <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <MapPin className="h-3 w-3 text-muted-foreground" />
                 <p className="font-medium text-sm truncate">{area.county}</p>
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
     </div>
   );
 }