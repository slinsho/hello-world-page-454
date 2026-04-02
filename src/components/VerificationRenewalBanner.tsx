import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";

export function VerificationRenewalBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"none" | "expiring_soon" | "expired">("none");
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", user.id)
        .single();

      if (profile?.verification_status === "expired") {
        setStatus("expired");
        return;
      }

      if (profile?.verification_status === "approved") {
        const { data: req } = await supabase
          .from("verification_requests")
          .select("expires_at")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (req?.expires_at) {
          const days = differenceInDays(new Date(req.expires_at), new Date());
          if (days <= 2) {
            setStatus("expiring_soon");
            setDaysLeft(Math.max(0, days));
          }
        }
      }
    };
    check();
  }, [user]);

  if (status === "none") return null;

  return (
    <div className={`rounded-2xl p-4 border ${
      status === "expired"
        ? "bg-destructive/10 border-destructive/30"
        : "bg-amber-500/10 border-amber-500/30"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          status === "expired" ? "bg-destructive/20" : "bg-amber-500/20"
        }`}>
          {status === "expired" ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Clock className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">
            {status === "expired" ? "Verification Expired" : "Verification Expiring Soon"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status === "expired"
              ? "Your verification has expired. Your properties are hidden from listings. Renew now to make them visible again."
              : `Your verification expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Renew now to avoid your properties being hidden.`
            }
          </p>
          <Button
            size="sm"
            className="mt-2 rounded-xl gap-1.5"
            variant={status === "expired" ? "destructive" : "default"}
            onClick={() => navigate("/verification")}
          >
            <Shield className="h-3.5 w-3.5" />
            Renew Verification
          </Button>
        </div>
      </div>
    </div>
  );
}
