import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Home, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Shield, Eye, MessageSquare, Flag, Star, FileCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  activeListings: number;
  pendingVerifications: number;
  pendingReports: number;
  pendingPromotions: number;
  totalInquiries: number;
  totalFeedback: number;
}

interface RecentActivity {
  id: string;
  type: "user" | "property" | "verification" | "report" | "promotion" | "inquiry";
  title: string;
  detail: string;
  time: string;
}

export function AdminDashboard({ onNavigateTab }: { onNavigateTab?: (tab: string) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchActivity()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [users, properties, active, verifications, reports, promotions, inquiries, feedback] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("properties").select("*", { count: "exact", head: true }),
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("property_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("promotion_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("property_inquiries").select("*", { count: "exact", head: true }),
        supabase.from("feedback").select("*", { count: "exact", head: true }),
      ]);

    setStats({
      totalUsers: users.count || 0,
      totalProperties: properties.count || 0,
      activeListings: active.count || 0,
      pendingVerifications: verifications.count || 0,
      pendingReports: reports.count || 0,
      pendingPromotions: promotions.count || 0,
      totalInquiries: inquiries.count || 0,
      totalFeedback: feedback.count || 0,
    });
  };

  const fetchActivity = async () => {
    const [recentUsers, recentProperties, recentVerifications, recentReports] = await Promise.all([
      supabase.from("profiles").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("properties").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
      supabase.from("verification_requests").select("id, status, created_at, verification_type").order("created_at", { ascending: false }).limit(3),
      supabase.from("property_reports").select("id, reason, created_at, status").order("created_at", { ascending: false }).limit(3),
    ]);

    const items: RecentActivity[] = [];

    recentUsers.data?.forEach((u) =>
      items.push({ id: u.id, type: "user", title: "New user registered", detail: u.name, time: u.created_at })
    );
    recentProperties.data?.forEach((p) =>
      items.push({ id: p.id, type: "property", title: "New property listed", detail: p.title, time: p.created_at })
    );
    recentVerifications.data?.forEach((v) =>
      items.push({ id: v.id, type: "verification", title: `Verification request (${v.verification_type})`, detail: v.status, time: v.created_at })
    );
    recentReports.data?.forEach((r) =>
      items.push({ id: r.id, type: "report", title: "Property reported", detail: r.reason, time: r.created_at })
    );

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivity(items.slice(0, 10));
  };

  const statCards = stats
    ? [
        {
          label: "Total Users",
          value: stats.totalUsers,
          icon: Users,
          color: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
        },
        {
          label: "Active Listings",
          value: stats.activeListings,
          icon: CheckCircle,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        },
        {
          label: "Total Properties",
          value: stats.totalProperties,
          icon: Home,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        },
        {
          label: "Inquiries",
          value: stats.totalInquiries,
          icon: MessageSquare,
          color: "text-violet-500",
          bg: "bg-violet-500/10",
          border: "border-violet-500/20",
        },
      ]
    : [];

  const urgentCards = stats
    ? [
        {
          label: "Pending Verifications",
          value: stats.pendingVerifications,
          icon: Clock,
          tab: "verifications",
          urgent: stats.pendingVerifications > 0,
        },
        {
          label: "Pending Reports",
          value: stats.pendingReports,
          icon: Flag,
          tab: "reports",
          urgent: stats.pendingReports > 0,
        },
        {
          label: "Pending Promotions",
          value: stats.pendingPromotions,
          icon: Star,
          tab: "promotions",
          urgent: stats.pendingPromotions > 0,
        },
      ]
    : [];

  const quickActions = [
    { label: "Verifications", icon: FileCheck, tab: "verifications" },
    { label: "Moderation", icon: Shield, tab: "moderation" },
    { label: "Reports", icon: Flag, tab: "reports" },
    { label: "Analytics", icon: TrendingUp, tab: "analytics" },
    { label: "Users", icon: Users, tab: "users" },
    { label: "Properties", icon: Home, tab: "properties" },
  ];

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "user": return <Users className="h-4 w-4 text-primary" />;
      case "property": return <Home className="h-4 w-4 text-blue-500" />;
      case "verification": return <FileCheck className="h-4 w-4 text-amber-500" />;
      case "report": return <Flag className="h-4 w-4 text-destructive" />;
      case "promotion": return <Star className="h-4 w-4 text-violet-500" />;
      case "inquiry": return <MessageSquare className="h-4 w-4 text-emerald-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className={`border ${card.border} ${card.bg} shadow-none`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Urgent / Action Required */}
      {urgentCards.some((c) => c.urgent) && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Needs Attention
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {urgentCards.map((card) => (
              <button
                key={card.label}
                onClick={() => onNavigateTab?.(card.tab)}
                className={`rounded-xl p-3 text-left transition-all border ${
                  card.urgent
                    ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                <card.icon className={`h-4 w-4 mb-2 ${card.urgent ? "text-amber-500" : "text-muted-foreground"}`} />
                <p className={`text-xl font-bold ${card.urgent ? "text-amber-500" : "text-foreground"}`}>
                  {card.value}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{card.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col gap-1.5 py-3 px-2 text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              onClick={() => onNavigateTab?.(action.tab)}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-80">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="divide-y divide-border">
                {activity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
