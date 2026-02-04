import { supabase } from "@/integrations/supabase/client";

export async function trackPropertyView(propertyId: string, userId?: string) {
  try {
    await supabase.from("property_views").insert({
      property_id: propertyId,
      viewer_id: userId || null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    // Silently fail - view tracking shouldn't break the app
    console.error("Failed to track view:", error);
  }
}
