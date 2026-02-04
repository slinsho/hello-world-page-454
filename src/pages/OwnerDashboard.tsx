import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  Eye, 
  MessageSquare, 
  Home, 
  TrendingUp, 
  Clock,
  Star,
  Users,
  ArrowUpRight
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

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
    totalViews: 0,
    totalInquiries: 0,
    totalProperties: 0,
    avgRating: 0,
    reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Fetch user's properties
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("id, title, photos, status")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (propertiesData) {
      // Fetch views and inquiries for each property
      const propsWithStats = await Promise.all(
        propertiesData.map(async (prop) => {
          const { count: viewsCount } = await supabase
            .from("property_views")
            .select("*", { count: "exact", head: true })
            .eq("property_id", prop.id);

          const { count: inquiriesCount } = await supabase
            .from("property_inquiries")
            .select("*", { count: "exact", head: true })
            .eq("property_id", prop.id);

          return {
            ...prop,
            views_count: viewsCount || 0,
            inquiries_count: inquiriesCount || 0,
          };
        })
      );

      setProperties(propsWithStats);

      // Calculate totals
      const totalViews = propsWithStats.reduce((sum, p) => sum + p.views_count, 0);
      const totalInquiries = propsWithStats.reduce((sum, p) => sum + p.inquiries_count, 0);

      // Fetch reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewed_user_id", user.id);

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setTotalStats({
        totalViews,
        totalInquiries,
        totalProperties: propsWithStats.length,
        avgRating,
        reviewCount: reviews?.length || 0,
      });

      // Fetch daily views for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, "yyyy-MM-dd");
      });

      const propertyIds = propsWithStats.map(p => p.id);
      
      if (propertyIds.length > 0) {
        const { data: viewsData } = await supabase
          .from("property_views")
          .select("viewed_at")
          .in("property_id", propertyIds)
          .gte("viewed_at", subDays(new Date(), 7).toISOString());

        const viewsByDate: Record<string, number> = {};
        viewsData?.forEach(v => {
          const date = format(new Date(v.viewed_at), "yyyy-MM-dd");
          viewsByDate[date] = (viewsByDate[date] || 0) + 1;
        });

        setDailyViews(last7Days.map(date => ({
          date: format(new Date(date), "MMM d"),
          views: viewsByDate[date] || 0,
        })));
      }
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <main className="container py-4 md:py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            My Dashboard
          </h1>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Home className="h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{totalStats.totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inquiries</p>
                  <p className="text-2xl font-bold">{totalStats.totalInquiries}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Properties</p>
                  <p className="text-2xl font-bold">{totalStats.totalProperties}</p>
                </div>
                <Home className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {totalStats.avgRating.toFixed(1)}
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({totalStats.reviewCount} reviews)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Views Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Views Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyViews.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No view data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Performance</CardTitle>
            <CardDescription>View stats for each of your listings</CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't listed any properties yet.</p>
                <Button onClick={() => navigate("/upload")} className="mt-4">
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/property/${prop.id}`)}
                    >
                      <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                        {prop.photos?.[0] ? (
                          <img
                            src={prop.photos[0]}
                            alt={prop.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <Home className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{prop.title}</p>
                        <Badge
                          variant={prop.status === "active" ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {prop.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{prop.views_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{prop.inquiries_count}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
