import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFormatLRD, usePlatformSettings } from "@/hooks/usePlatformSettings";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Megaphone, Clock, CheckCircle2, XCircle, DollarSign, Home, Plus, ArrowUpRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { VerificationRenewalBanner } from "@/components/VerificationRenewalBanner";

interface PromotionStats {
  id: string;
  property_id: string;
  property_title: string;
  property_photo: string | null;
  status: string;
  payment_status: string;
  duration_months: number;
  payment_amount: number | null;
  created_at: string;
  payment_confirmed_at: string | null;
  views_count: number;
  is_promoted: boolean;
}

export default function OwnerPromotionDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const formatLRD = useFormatLRD();
  const { settings } = usePlatformSettings();
  const [promotions, setPromotions] = useState<PromotionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    totalViews: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchPromotionData();
  }, [user, authLoading]);

  const fetchPromotionData = async () => {
    if (!user) return;

    // Fetch all promotion requests for the user
    const { data: requests } = await supabase
      .from("promotion_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!requests || requests.length === 0) {
      setLoading(false);
      return;
    }

    const propertyIds = [...new Set(requests.map(r => r.property_id))];
    const { data: propsData } = await supabase
      .from("properties")
      .select("id, title, photos, is_promoted")
      .in("id", propertyIds);

    const { data: viewData } = await supabase
      .from("property_views")
      .select("property_id, viewed_at")
      .in("property_id", propertyIds);

    const viewsByProperty = new Map<string, string[]>();
    (viewData || []).forEach((v) => {
      const existing = viewsByProperty.get(v.property_id) || [];
      existing.push(v.viewed_at);
      viewsByProperty.set(v.property_id, existing);
    });

    const propsMap = new Map(propsData?.map(p => [p.id, p]) || []);

    const enriched: PromotionStats[] = requests.map(req => {
      const prop = propsMap.get(req.property_id);
      const approvedAt = req.payment_confirmed_at || req.processed_at;
      const propertyViewDates = viewsByProperty.get(req.property_id) || [];
      const viewsSinceApproval = approvedAt
        ? propertyViewDates.filter((viewedAt) => new Date(viewedAt) >= new Date(approvedAt)).length
        : 0;

      return {
        id: req.id,
        property_id: req.property_id,
        property_title: prop?.title || "Unknown Property",
        property_photo: prop?.photos?.[0] || null,
        status: req.status,
        payment_status: req.payment_status,
        duration_months: req.duration_months || 1,
        payment_amount: req.payment_amount,
        created_at: req.created_at,
        payment_confirmed_at: req.payment_confirmed_at,
        views_count: viewsSinceApproval,
        is_promoted: prop?.is_promoted || false,
      };
    });

    setPromotions(enriched);

    const activeCount = enriched.filter(
      (p) => p.status === "approved" && p.payment_status === "confirmed" && p.is_promoted
    ).length;
    const totalViews = enriched
      .filter((p) => p.status === "approved" && p.payment_status === "confirmed")
      .reduce((sum, p) => sum + p.views_count, 0);
    const totalSpent = enriched
      .filter(p => p.payment_status === "paid" || p.payment_status === "confirmed")
      .reduce((sum, p) => sum + (p.payment_amount || 0), 0);

    setTotalStats({
      totalPromotions: enriched.length,
      activePromotions: activeCount,
      totalViews,
      totalSpent,
    });

    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="px-4 pt-4 space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Promotions</h1>
            <p className="text-sm text-muted-foreground">Track your promoted properties</p>
          </div>
          <Button onClick={() => navigate("/upload")} size="icon" className="h-11 w-11 rounded-full">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Verification Renewal Banner */}
        <VerificationRenewalBanner />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalStats.totalPromotions}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
              <Sparkles className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{totalStats.activePromotions}</p>
            <p className="text-xs text-muted-foreground">Active Now</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{totalStats.totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold">${totalStats.totalSpent}</p>
            </div>
            <p className="text-xs text-muted-foreground">{formatLRD(totalStats.totalSpent)} spent</p>
          </div>
        </div>

        {/* Promotion List */}
        <h2 className="font-semibold mb-3">Promotion History</h2>
        {promotions.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No promotions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Promote your properties to get more visibility and views
            </p>
            <Button onClick={() => navigate("/explore")} className="rounded-full">
              Browse Your Properties
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-all"
                onClick={() => navigate(`/property/${promo.property_id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0">
                    {promo.property_photo ? (
                      <img src={promo.property_photo} alt={promo.property_title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{promo.property_title}</p>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] h-5 px-2 gap-1 ${getStatusColor(promo.status)}`}>
                        {getStatusIcon(promo.status)}
                        {promo.status}
                      </Badge>
                      {promo.is_promoted && (
                        <Badge className="text-[10px] h-5 px-2 gap-1 bg-primary/10 text-primary border-primary/20" variant="outline">
                          <Sparkles className="h-2.5 w-2.5" /> Live
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {promo.duration_months} mo
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{promo.views_count} views</span>
                      </div>
                      {promo.payment_amount && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${promo.payment_amount} ({formatLRD(promo.payment_amount)})</span>
                        </div>
                      )}
                      <span>{format(new Date(promo.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
