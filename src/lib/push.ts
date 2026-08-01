import { supabase } from "@/integrations/supabase/client";
import { canUseServiceWorkerRuntime } from "@/lib/pwa";

export const VAPID_PUBLIC_KEY =
  "BHtKBMbYFvE_zMDPfCGDZMFcW3FOWMVy14mXijQfsKQ4KqJJH4Qg_P5TNhQjOuivP266s1J7y_iVbcBS4NIykV4";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "PushManager" in window &&
  canUseServiceWorkerRuntime();

export const getPushSubscription = async () => {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
};

export const isPushEnabled = async () => {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;
  return Boolean(await getPushSubscription());
};

/** Ask permission, subscribe the device and persist it for this user. */
export const enablePush = async (): Promise<{ ok: boolean; error?: string }> => {
  if (!pushSupported()) return { ok: false, error: "Push notifications aren't supported on this device/browser." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "Notification permission was denied." };

  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready);
  if (!reg) return { ok: false, error: "Service worker not available yet. Try again in a moment." };

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json: any = sub.toJSON();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Please sign in first." };

  const { error } = await supabase.from("push_subscriptions" as any).upsert(
    {
      user_id: auth.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent,
    } as any,
    { onConflict: "endpoint" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
};

export const disablePush = async () => {
  const sub = await getPushSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  await (supabase.from("push_subscriptions" as any) as any).delete().eq("endpoint", endpoint);
  return { ok: true };
};
