import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Eye, Clock, TrendingUp, Megaphone } from "lucide-react";
import { PromotePropertyDialog } from "@/components/PromotePropertyDialog";
import { formatDistanceToNow, differenceInDays, addMonths } from "date-fns";

interface PromotionWithProperty {
  id: string;
  property_id: string;
  status: string;
  payment_status: string;
  duration_months: number | null;
  payment_amount: number | null;
  created_at: string;
  processed_at: string | null;
  payment_confirmed_at: string | null;
  admin_note: string | null;
  property_title: string;
  property_photo: string;
  is_promoted: boolean;
  impression_count: number;
  view_count: number;
}

interface OwnerPromotionsTabProps {
  properties: any[];
}

export function OwnerPromotionsTab({ properties }: OwnerPromotionsTabProps) {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<PromotionWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchPromotions();
  }, [user]);

  const fetchPromotions = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch promotion requests
    const { data: requests } = await supabase
      .from("promotion_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!requests || requests.length === 0) {
      setPromotions([]);
      setLoading(false);
      return;
    }

    // Fetch associated properties
    const propertyIds = [...new Set(requests.map((r) => r.property_id))];
    const { data: props } = await supabase
      .from("properties")
      .select("id, title, photos, is_promoted, promotion_impression_count")
      .in("id", propertyIds);

    // Fetch view events (we'll count only after each request is approved/confirmed)
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

    const propsMap = new Map((props || []).map((p) => [p.id, p]));

    setPromotions(
      requests.map((r) => {
        const prop = propsMap.get(r.property_id);
        const approvedAt = r.payment_confirmed_at || r.processed_at;
        const propertyViewDates = viewsByProperty.get(r.property_id) || [];
        const viewCountSinceApproval = approvedAt
          ? propertyViewDates.filter((viewedAt) => new Date(viewedAt) >= new Date(approvedAt)).length
          : 0;

        return {
          id: r.id,
          property_id: r.property_id,
          status: r.status,
          payment_status: r.payment_status,
          duration_months: r.duration_months,
          payment_amount: r.payment_amount,
          created_at: r.created_at,
          processed_at: r.processed_at,
          payment_confirmed_at: r.payment_confirmed_at,
          admin_note: r.admin_note,
          property_title: prop?.title || "Unknown Property",
          property_photo: prop?.photos?.[0] || "/placeholder.svg",
          is_promoted: prop?.is_promoted || false,
          impression_count:
            r.status === "approved" && r.payment_status === "confirmed"
              ? (prop as any)?.promotion_impression_count || 0
              : 0,
          view_count: viewCountSinceApproval,
        };
      })
    );
    setLoading(false);
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === "approved" && paymentStatus === "confirmed")
      return <Badge className="bg-green-500/20 text-green-600 text-[10px]">Active</Badge>;
    if (status === "approved" && paymentStatus === "requested")
      return <Badge className="bg-yellow-500/20 text-yellow-600 text-[10px]">Payment Pending</Badge>;
    if (status === "approved")
      return <Badge className="bg-blue-500/20 text-blue-600 text-[10px]">Approved</Badge>;
    if (status === "pending")
      return <Badge className="bg-yellow-500/20 text-yellow-600 text-[10px]">Pending Review</Badge>;
    if (status === "rejected")
      return <Badge className="bg-destructive/20 text-destructive text-[10px]">Rejected</Badge>;
    return <Badge className="bg-muted text-muted-foreground text-[10px]">{status}</Badge>;
  };

  const getCountdown = (processedAt: string | null, durationMonths: number | null) => {
    if (!processedAt || !durationMonths) return null;
    const endDate = addMonths(new Date(processedAt), durationMonths);
    const daysLeft = differenceInDays(endDate, new Date());
    if (daysLeft <= 0) return <span className="text-destructive text-[10px] font-medium">Expired</span>;
    return (
      <span className="text-primary text-[10px] font-medium flex items-center gap-0.5">
        <Clock className="h-3 w-3" />{daysLeft}d left
      </span>
    );
  };

  const activePromotions = promotions.filter(
    (p) => p.status === "approved" && p.payment_status === "confirmed" && p.is_promoted
  );

  // Properties eligible for promotion (active, not already promoted)
  const eligibleProperties = properties.filter(
    (p) => p.status === "active" && !p.is_promoted
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Promote CTA */}
      {eligibleProperties.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-primary" /> Promote a Property
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {eligibleProperties.length} {eligibleProperties.length === 1 ? "property" : "properties"} eligible
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {eligibleProperties.slice(0, 3).map((p) => (
              <PromotePropertyDialog
                key={p.id}
                propertyId={p.id}
                propertyTitle={p.title}
                isOwner={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats summary */}
      {promotions.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-lg font-bold">{promotions.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Requests</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-center">
            <p className="text-lg font-bold text-primary">{activePromotions.length}</p>
            <p className="text-[10px] text-muted-foreground">Active Promos</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-lg font-bold">
              {activePromotions.reduce((sum, p) => sum + p.impression_count, 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Impressions</p>
          </div>
        </div>
      )}

      {/* Promotion list */}
      {promotions.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-xl border border-border/50">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground mt-2 text-sm">No promotions yet</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Promote your properties to get more visibility
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-card rounded-xl border border-border/50 overflow-hidden"
            >
              <div className="flex gap-3 p-3">
                <img
                  src={promo.property_photo}
                  alt={promo.property_title}
                  className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold truncate">{promo.property_title}</p>
                    {getStatusBadge(promo.status, promo.payment_status)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {promo.duration_months
                      ? `${promo.duration_months} month${promo.duration_months > 1 ? "s" : ""}`
                      : "Duration pending"}
                    {promo.payment_amount
                      ? ` · $${promo.payment_amount}`
                      : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Requested {formatDistanceToNow(new Date(promo.created_at), { addSuffix: true })}
                  </p>
                  {promo.admin_note && (
                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                      Admin: {promo.admin_note}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats row for active promotions */}
              {(promo.status === "approved" && promo.payment_status === "confirmed" && promo.is_promoted) && (
                <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />{promo.impression_count} impressions
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Eye className="h-3 w-3" />{promo.view_count} views
                    </span>
                  </div>
                  {getCountdown(promo.processed_at, promo.duration_months)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
