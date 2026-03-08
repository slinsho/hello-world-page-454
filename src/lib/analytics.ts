import { supabase } from "@/integrations/supabase/client";

export async function trackPropertyView(propertyId: string, userId?: string) {
  try {
    await supabase.from("property_views").insert({
      property_id: propertyId,
      viewer_id: userId || null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error("Failed to track view:", error);
  }
}

// Lightweight analytics event logger - logs to console in dev, can be extended
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventName}`, properties || {});
    }
    // Store key events in sessionStorage for debugging
    const events = JSON.parse(sessionStorage.getItem("analytics_events") || "[]");
    events.push({ event: eventName, properties, timestamp: new Date().toISOString() });
    if (events.length > 50) events.shift();
    sessionStorage.setItem("analytics_events", JSON.stringify(events));
  } catch {
    // Silently fail
  }
}

// Pre-defined event helpers
export const analytics = {
  search: (query: string, filters?: Record<string, any>) =>
    trackEvent("search", { query, ...filters }),
  
  favoriteToggle: (propertyId: string, isFavorite: boolean) =>
    trackEvent("favorite_toggle", { propertyId, isFavorite }),
  
  inquiry: (propertyId: string) =>
    trackEvent("inquiry_sent", { propertyId }),
  
  propertyView: (propertyId: string) =>
    trackEvent("property_view", { propertyId }),
  
  signup: (role: string) =>
    trackEvent("signup", { role }),
  
  login: () =>
    trackEvent("login"),
  
  shareProperty: (propertyId: string, method: string) =>
    trackEvent("share_property", { propertyId, method }),
  
  filterApply: (filters: Record<string, any>) =>
    trackEvent("filter_apply", filters),
  
  pageView: (page: string) =>
    trackEvent("page_view", { page }),
};
