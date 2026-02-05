 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { TrendingUp, TrendingDown, Home, DollarSign, Eye, Building } from "lucide-react";
 
 interface MarketStats {
   totalListings: number;
   avgPrice: number;
   priceChange: number;
   hotCounty: string;
   totalViews: number;
   newListingsThisWeek: number;
 }
 
 export default function MarketTrends() {
   const [stats, setStats] = useState<MarketStats | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchStats = async () => {
       // Get total active listings
       const { count: totalListings } = await supabase
         .from("properties")
         .select("*", { count: "exact", head: true })
         .eq("status", "active");
 
       // Get average price
       const { data: priceData } = await supabase
         .from("properties")
         .select("price_usd")
         .eq("status", "active");
 
       const avgPrice = priceData && priceData.length > 0
         ? priceData.reduce((sum, p) => sum + p.price_usd, 0) / priceData.length
         : 0;
 
       // Get county with most listings
       const { data: countyData } = await supabase
         .from("properties")
         .select("county")
         .eq("status", "active");
 
       const countyCounts: Record<string, number> = {};
       countyData?.forEach((p) => {
         countyCounts[p.county] = (countyCounts[p.county] || 0) + 1;
       });
       const hotCounty = Object.entries(countyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
 
       // Get total views this week
       const weekAgo = new Date();
       weekAgo.setDate(weekAgo.getDate() - 7);
       const { count: totalViews } = await supabase
         .from("property_views")
         .select("*", { count: "exact", head: true })
         .gte("viewed_at", weekAgo.toISOString());
 
       // Get new listings this week
       const { count: newListingsThisWeek } = await supabase
         .from("properties")
         .select("*", { count: "exact", head: true })
         .gte("created_at", weekAgo.toISOString());
 
       setStats({
         totalListings: totalListings || 0,
         avgPrice: Math.round(avgPrice),
         priceChange: 2.5, // Mock trend - would need historical data
         hotCounty,
         totalViews: totalViews || 0,
         newListingsThisWeek: newListingsThisWeek || 0,
       });
       setLoading(false);
     };
 
     fetchStats();
   }, []);
 
   if (loading || !stats) {
     return (
       <div className="grid grid-cols-2 gap-3 mb-6">
         {[1, 2, 3, 4].map((i) => (
           <div key={i} className="bg-card rounded-2xl p-4 h-24 animate-pulse border border-border" />
         ))}
       </div>
     );
   }
 
   return (
     <div className="mb-6">
       <h2 className="text-lg font-bold mb-3">Market Overview</h2>
       <div className="grid grid-cols-2 gap-3">
         {/* Total Listings */}
         <div className="bg-card rounded-2xl p-4 border border-border">
           <div className="flex items-center gap-2 mb-2">
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
               <Home className="h-4 w-4 text-primary" />
             </div>
           </div>
           <p className="text-xl font-bold">{stats.totalListings.toLocaleString()}</p>
           <p className="text-xs text-muted-foreground">Active Listings</p>
         </div>
 
         {/* Average Price */}
         <div className="bg-card rounded-2xl p-4 border border-border">
           <div className="flex items-center justify-between mb-2">
             <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
               <DollarSign className="h-4 w-4 text-green-500" />
             </div>
             <div className="flex items-center gap-0.5 text-xs font-medium text-green-500">
               <TrendingUp className="h-3 w-3" />
               {stats.priceChange}%
             </div>
           </div>
           <p className="text-xl font-bold">${(stats.avgPrice / 1000).toFixed(0)}k</p>
           <p className="text-xs text-muted-foreground">Avg Price</p>
         </div>
 
         {/* Weekly Views */}
         <div className="bg-card rounded-2xl p-4 border border-border">
           <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
             <Eye className="h-4 w-4 text-blue-500" />
           </div>
           <p className="text-xl font-bold">{stats.totalViews.toLocaleString()}</p>
           <p className="text-xs text-muted-foreground">Views This Week</p>
         </div>
 
         {/* Hot County */}
         <div className="bg-card rounded-2xl p-4 border border-border">
           <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
             <Building className="h-4 w-4 text-orange-500" />
           </div>
           <p className="text-lg font-bold truncate">{stats.hotCounty}</p>
           <p className="text-xs text-muted-foreground">Trending Area</p>
         </div>
       </div>
     </div>
   );
 }