import { supabase } from "@/integrations/supabase/client";

/**
 * Sends a notification to all admin users via a SECURITY DEFINER database function.
 * This bypasses RLS so non-admin users can trigger admin notifications.
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
    const { error } = await supabase.rpc("notify_all_admins" as any, {
      p_title: title,
      p_message: message,
      p_type: type,
      p_property_id: propertyId || null,
    });
    if (error) {
      console.error("Failed to notify admins:", error);
    }
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
}
