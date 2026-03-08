import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFormatLRD } from "@/hooks/usePlatformSettings";
import { Badge } from "@/components/ui/badge";
import { Eye, Megaphone, Clock, CheckCircle2, XCircle, DollarSign, Home, Sparkles, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

interface PromotionItem {
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

export function DashboardPromotions({ userId, propertyIds }: { userId: string; propertyIds: string[] }) {
  const navigate = useNavigate();
  const formatLRD = useFormatLRD();
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || propertyIds.length === 0) { setLoading(false); return; }
    fetchPromotions();
  }, [userId, propertyIds]);

  const fetchPromotions = async () => {
    const { data: requests } = await supabase
      .from("promotion_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!requests || requests.length === 0) { setLoading(false); return; }

    const reqPropIds = [...new Set(requests.map(r => r.property_id))];
    const { data: propsData } = await supabase
      .from("properties")
      .select("id, title, photos, is_promoted")
      .in("id", reqPropIds);

    const { data: viewData } = await supabase
      .from("property_views")
      .select("property_id, viewed_at")
      .in("property_id", reqPropIds);

    const viewsByProperty = new Map<string, string[]>();
    (viewData || []).forEach((v) => {
      const existing = viewsByProperty.get(v.property_id) || [];
      existing.push(v.viewed_at);
      viewsByProperty.set(v.property_id, existing);
    });

    const propsMap = new Map(propsData?.map(p => [p.id, p]) || []);

    setPromotions(
      requests.map(req => {
        const prop = propsMap.get(req.property_id);
        const approvedAt = req.payment_confirmed_at || req.processed_at;
        const propertyViewDates = viewsByProperty.get(req.property_id) || [];
        const viewsSinceApproval = approvedAt
          ? propertyViewDates.filter((viewedAt) => new Date(viewedAt) >= new Date(approvedAt)).length
          : 0;

        return {
          id: req.id,
          property_id: req.property_id,
          property_title: prop?.title || "Unknown",
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
      })
    );
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Megaphone className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-sm">No promotions yet</p>
        <p className="text-xs text-muted-foreground mt-1">Promote properties from their detail page</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 space-y-3">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="rounded-xl border border-border p-3 flex items-start gap-3 cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-all"
            onClick={() => navigate(`/property/${promo.property_id}`)}
          >
            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
              {promo.property_photo ? (
                <img src={promo.property_photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center"><Home className="h-4 w-4 text-muted-foreground" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{promo.property_title}</p>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className={`text-[10px] h-5 px-2 ${getStatusColor(promo.status)}`}>
                  {promo.status}
                </Badge>
                {promo.is_promoted && (
                  <Badge className="text-[10px] h-5 px-2 gap-1 bg-primary/10 text-primary border-primary/20" variant="outline">
                    <Sparkles className="h-2.5 w-2.5" /> Live
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{promo.views_count}</span>
                {promo.payment_amount && <span>${promo.payment_amount} ({formatLRD(promo.payment_amount)})</span>}
                <span>{format(new Date(promo.created_at), "MMM d")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
