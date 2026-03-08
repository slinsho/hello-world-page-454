import { supabase } from "@/integrations/supabase/client";

/**
 * Sends a notification to all admin users.
 * Fetches admin user IDs from user_roles and inserts notifications for each.
 */
export async function notifyAdmins({
  title,
  message,
  type = "status_updates",
  propertyId,
}: {
  title: string;
  message: string;
  type?: string;
  propertyId?: string | null;
}) {
  try {
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles?.length) return;

    const notifications = adminRoles.map((admin) => ({
      user_id: admin.user_id,
      title,
      message,
      type,
      ...(propertyId ? { property_id: propertyId } : {}),
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
}
