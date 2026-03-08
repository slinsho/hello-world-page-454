import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminVerifications } from "@/components/admin/AdminVerifications";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminProperties } from "@/components/admin/AdminProperties";
import AdminFeedback from "@/components/admin/AdminFeedback";
import { AdminPromotions } from "@/components/admin/AdminPromotions";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminRateSettings } from "@/components/admin/AdminRateSettings";
import { Shield } from "lucide-react";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase.rpc("is_admin", {
          user_id: user.id,
        });

        if (error) throw error;

        if (!data) {
          navigate("/");
          return;
        }

        setIsAdmin(true);
      } catch {
        navigate("/");
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">Admin Portal</h1>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 h-auto">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-1.5">Dashboard</TabsTrigger>
          <TabsTrigger value="verifications" className="text-xs sm:text-sm px-1.5">Verifications</TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs sm:text-sm px-1.5">Promotions</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm px-1.5">Reports</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm px-1.5">Users</TabsTrigger>
          <TabsTrigger value="properties" className="text-xs sm:text-sm px-1.5">Properties</TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs sm:text-sm px-1.5">Feedback</TabsTrigger>
          <TabsTrigger value="rates" className="text-xs sm:text-sm px-1.5">Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="verifications">
          <AdminVerifications />
        </TabsContent>

        <TabsContent value="promotions">
          <AdminPromotions />
        </TabsContent>

        <TabsContent value="reports">
          <AdminReports />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="properties">
          <AdminProperties />
        </TabsContent>

        <TabsContent value="feedback">
          <AdminFeedback />
        </TabsContent>

        <TabsContent value="rates">
          <AdminRateSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
