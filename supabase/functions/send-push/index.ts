// Sends web push notifications to a user's registered devices.
// Auth: either an admin/self-authenticated caller, or the CRON_SECRET header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { user_id, title, body: message, url, tag } = body as Record<string, string>;

    if (!title || !message) {
      return new Response(JSON.stringify({ error: "title and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorize: cron secret OR a signed-in user pushing to themselves OR an admin.
    const cronOk = req.headers.get("x-cron-secret") === Deno.env.get("CRON_SECRET");
    let targetUser = user_id;
    if (!cronOk) {
      const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
      const { data: userData } = await admin.auth.getUser(jwt);
      const caller = userData?.user;
      if (!caller) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await admin.rpc("is_admin", { user_id: caller.id });
      if (!isAdmin && targetUser && targetUser !== caller.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUser = targetUser || caller.id;
    }

    if (!targetUser) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") || "mailto:support@lprop.app",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", targetUser);

    const payload = JSON.stringify({ title, body: message, url: url || "/notifications", tag });
    let sent = 0;
    const stale: string[] = [];

    for (const s of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) stale.push(s.endpoint);
        else console.error("push failed", err?.statusCode, err?.message);
      }
    }

    if (stale.length) {
      await admin.from("push_subscriptions").delete().in("endpoint", stale);
    }

    return new Response(JSON.stringify({ sent, removed: stale.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
