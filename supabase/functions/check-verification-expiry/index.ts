import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: require a shared secret, valid service-role JWT, or anon key (for pg_cron)
    const cronSecret = Deno.env.get('CRON_SECRET');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('authorization');
    const providedSecret = req.headers.get('x-cron-secret');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const isServiceRole = bearerToken === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const isAnonKey = anonKey && bearerToken === anonKey;
    const isCronAuth = cronSecret && providedSecret === cronSecret;

    if (!isServiceRole && !isCronAuth && !isAnonKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date().toISOString();

    // 1. Send warning notifications for verifications expiring within 2 days
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: soonExpiring } = await adminClient
      .from('verification_requests')
      .select('id, user_id, verification_type, expires_at')
      .eq('status', 'approved')
      .not('expires_at', 'is', null)
      .gt('expires_at', now)
      .lte('expires_at', twoDaysFromNow);

    if (soonExpiring && soonExpiring.length > 0) {
      for (const req of soonExpiring) {
        const daysLeft = Math.max(1, Math.ceil((new Date(req.expires_at!).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        // Check if we already sent a warning for this request (avoid duplicates)
        const { data: existing } = await adminClient
          .from('notifications')
          .select('id')
          .eq('user_id', req.user_id)
          .like('title', '%Verification Expiring%')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!existing || existing.length === 0) {
          await adminClient.from('notifications').insert({
            user_id: req.user_id,
            title: 'Verification Expiring Soon',
            message: `Your ${req.verification_type === 'agent' ? 'agent' : 'owner'} verification expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Please renew to keep your properties visible.`,
            type: 'status_updates',
          });
        }
      }
      console.log(`Sent ${soonExpiring.length} expiry warning notifications`);
    }

    // 2. Find approved verification requests that have expired
    const { data: expiredRequests, error } = await adminClient
      .from('verification_requests')
      .select('id, user_id, verification_type')
      .eq('status', 'approved')
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (error) {
      console.error('Error fetching expired verifications:', error);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!expiredRequests || expiredRequests.length === 0) {
      return new Response(JSON.stringify({ message: 'No expired verifications found', processed: 0, warnings: soonExpiring?.length || 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;

    for (const req of expiredRequests) {
      // Update verification request status to expired
      await adminClient.from('verification_requests').update({
        status: 'expired',
      }).eq('id', req.id);

      // Update profile verification_status to expired
      await adminClient.from('profiles').update({
        verification_status: 'expired',
      }).eq('id', req.user_id);

      // Set all user's active properties to inactive (hidden from homepage/explore)
      await adminClient.from('properties').update({
        status: 'inactive',
      }).eq('owner_id', req.user_id).eq('status', 'active');

      // Notify user
      await adminClient.from('notifications').insert({
        user_id: req.user_id,
        title: 'Verification Expired',
        message: `Your ${req.verification_type === 'agent' ? 'agent' : 'owner'} verification has expired. Your properties are now hidden. Please renew your verification to make them visible again.`,
        type: 'status_updates',
      });

      processed++;
    }

    console.log(`Processed ${processed} expired verifications`);

    return new Response(JSON.stringify({ success: true, processed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error in check-verification-expiry:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
