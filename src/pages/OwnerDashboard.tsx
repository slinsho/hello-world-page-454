import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MessageSquare, Home, Star, ArrowUpRight, Plus, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { format, subDays } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { UpgradeToAgentDialog } from "@/components/UpgradeToAgentDialog";
import { DashboardInquiries } from "@/components/dashboard/DashboardInquiries";

interface PropertyStats {
  id: string;
  title: string;
  photos: string[];
  views_count: number;
  inquiries_count: number;
  status: string;
}

interface DailyViews {
  date: string;
  views: number;
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<PropertyStats[]>([]);
  const [dailyViews, setDailyViews] = useState<DailyViews[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalViews: 0, totalInquiries: 0, totalProperties: 0, avgRating: 0, reviewCount: 0, viewsTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) {
      const checkRole = async () => {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data?.role === "property_owner") { navigate("/owner-promotions", { replace: true }); return; }
      };
      checkRole();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && !showUpgrade) fetchDashboardData();
  }, [user, showUpgrade]);

  const fetchDashboardData = async () => {
    if (!user) return;
    const { data: propertiesData } = await supabase.from("properties").select("id, title, photos, status").eq("owner_id", user.id).order("created_at", { ascending: false });
    if (propertiesData) {
      const propsWithStats = await Promise.all(
        propertiesData.map(async (prop) => {
          const { count: viewsCount } = await supabase.from("property_views").select("*", { count: "exact", head: true }).eq("property_id", prop.id);
          const { count: inquiriesCount } = await supabase.from("property_inquiries").select("*", { count: "exact", head: true }).eq("property_id", prop.id);
          return { ...prop, views_count: viewsCount || 0, inquiries_count: inquiriesCount || 0 };
        })
      );
      setProperties(propsWithStats);
      const totalViews = propsWithStats.reduce((sum, p) => sum + p.views_count, 0);
      const totalInquiries = propsWithStats.reduce((sum, p) => sum + p.inquiries_count, 0);
      const { data: reviews } = await supabase.from("reviews").select("rating").eq("reviewed_user_id", user.id);
      const avgRating = reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));
      const propertyIds = propsWithStats.map(p => p.id);
      let viewsTrend = 0;
      if (propertyIds.length > 0) {
        const { data: viewsData } = await supabase.from("property_views").select("viewed_at").in("property_id", propertyIds).gte("viewed_at", subDays(new Date(), 7).toISOString());
        const viewsByDate: Record<string, number> = {};
        viewsData?.forEach(v => { const date = format(new Date(v.viewed_at), "yyyy-MM-dd"); viewsByDate[date] = (viewsByDate[date] || 0) + 1; });
        const chartData = last7Days.map(date => ({ date: format(new Date(date), "MMM d"), views: viewsByDate[date] || 0 }));
        setDailyViews(chartData);
        const recent = chartData.slice(-3).reduce((s, d) => s + d.views, 0);
        const previous = chartData.slice(1, 4).reduce((s, d) => s + d.views, 0);
        viewsTrend = previous > 0 ? Math.round(((recent - previous) / previous) * 100) : 0;
      }
      setTotalStats({ totalViews, totalInquiries, totalProperties: propsWithStats.length, avgRating, reviewCount: reviews?.length || 0, viewsTrend });
    }
    setLoading(false);
  };

  if (showUpgrade) {
    return (<div className="min-h-screen bg-background"><Navbar /><UpgradeToAgentDialog open={true} onOpenChange={(open) => { if (!open) navigate(-1); }} featureName="Dashboard" /></div>);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="px-4 pt-4 space-y-4 max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1><p className="text-sm text-muted-foreground">Your property analytics</p></div>
          <Button onClick={() => navigate("/upload")} size="icon" className="h-11 w-11 rounded-full"><Plus className="h-5 w-5" /></Button>
        </div>

        {/* Stats Grid - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-start justify-between mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Eye className="h-5 w-5 text-primary" /></div>
              {totalStats.viewsTrend !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${totalStats.viewsTrend > 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalStats.viewsTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(totalStats.viewsTrend)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold">{totalStats.totalViews.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-start justify-between mb-2"><div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center"><MessageSquare className="h-5 w-5 text-blue-500" /></div></div>
            <p className="text-2xl font-bold">{totalStats.totalInquiries.toLocaleString()}</p><p className="text-xs text-muted-foreground">Inquiries</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-start justify-between mb-2"><div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center"><Home className="h-5 w-5 text-purple-500" /></div></div>
            <p className="text-2xl font-bold">{totalStats.totalProperties}</p><p className="text-xs text-muted-foreground">Properties</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-start justify-between mb-2"><div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center"><Star className="h-5 w-5 text-yellow-500" /></div></div>
            <div className="flex items-baseline gap-1"><p className="text-2xl font-bold">{totalStats.avgRating.toFixed(1)}</p><span className="text-xs text-muted-foreground">/ 5</span></div>
            <p className="text-xs text-muted-foreground">{totalStats.reviewCount} reviews</p>
          </div>
        </div>

        {/* Desktop: Views + Properties side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Views Trend */}
          <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
            <div className="flex items-center justify-between mb-4"><div><h2 className="font-semibold">Views Trend</h2><p className="text-xs text-muted-foreground">Last 7 days</p></div></div>
            {dailyViews.length > 0 && dailyViews.some(d => d.views > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={dailyViews}>
                  <defs><linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#viewsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No view data yet</div>
            )}
          </div>

          {/* Properties List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Your Properties</h2>
              {properties.length > 5 && <Button variant="ghost" size="sm" className="text-primary text-xs gap-1 h-8">See All <ChevronRight className="h-3 w-3" /></Button>}
            </div>
            {properties.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 border border-border text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><Home className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="font-semibold mb-1">No properties yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start by adding your first property listing</p>
                <Button onClick={() => navigate("/upload")} className="rounded-full"><Plus className="h-4 w-4 mr-2" />Add Property</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 5).map((prop) => (
                  <div key={prop.id} className="bg-card rounded-2xl p-3 border border-border flex items-center gap-3 cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-all" onClick={() => navigate(`/property/${prop.id}`)}>
                    <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0">
                      {prop.photos?.[0] ? <img src={prop.photos[0]} alt={prop.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-muted flex items-center justify-center"><Home className="h-5 w-5 text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{prop.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" /><span>{prop.views_count}</span></div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3" /><span>{prop.inquiries_count}</span></div>
                        <Badge variant={prop.status === "active" ? "default" : "secondary"} className="text-[10px] h-5 px-2">{prop.status}</Badge>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inquiries & Offers */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Inquiries & Offers</h2>
          <DashboardInquiries userId={user?.id || ""} propertyIds={properties.map(p => p.id)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-14 rounded-2xl flex-col gap-1" onClick={() => navigate("/messages")}><MessageSquare className="h-5 w-5" /><span className="text-xs">Messages</span></Button>
          <Button variant="outline" className="h-14 rounded-2xl flex-col gap-1" onClick={() => navigate(`/profile/${user?.id}`)}><Star className="h-5 w-5" /><span className="text-xs">Reviews</span></Button>
        </div>
      </main>
    </div>
  );
}
