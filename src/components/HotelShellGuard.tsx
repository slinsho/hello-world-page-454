import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Routes a Hotel Owner is allowed to visit. Everything else redirects to /hotel-dashboard.
const HOTEL_ALLOWED_PREFIXES = [
  "/hotel-dashboard",
  "/hotels",
  "/auth",
  "/verification",
  "/notifications",
  "/messages",
  "/settings",
  "/profile",
  "/feedback",
  "/terms",
  "/privacy",
  "/about",
];

/**
 * Fully hides the property marketplace for users whose role === 'hotel'.
 * When they land on any non-allowed route, they are redirected to their dashboard.
 */
const HotelShellGuard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setRole(null); return; }
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      .then(({ data }) => setRole(data?.role || null));
  }, [user]);

  useEffect(() => {
    const p = location.pathname;
    if (role === "receptionist") {
      const ok = ["/hotel-dashboard/bookings", "/hotel-dashboard/check-in", "/auth", "/notifications", "/settings", "/profile"]
        .some((prefix) => p === prefix || p.startsWith(prefix + "/"));
      if (!ok) navigate("/hotel-dashboard/bookings", { replace: true });
      return;
    }
    if (role !== "hotel") return;
    const allowed = HOTEL_ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/"));
    if (!allowed) navigate("/hotel-dashboard", { replace: true });
  }, [role, location.pathname, navigate]);

  return null;
};

export default HotelShellGuard;
