import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  requestId: string;
  userId: string;
  action: 'approve' | 'reject' | 'request_payment' | 'confirm_payment' | 'request_renewal_payment' | 'confirm_renewal_payment' | 'request_resend';
  adminNote?: string | null;
  paymentAmount?: number | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, userId, action, adminNote, paymentAmount }: RequestBody = await req.json();

    if (!requestId || !userId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate admin
    let adminId: string | null = null;
    try {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      const jwt = authHeader?.replace('Bearer ', '');
      if (jwt) {
        const { data, error } = await adminClient.auth.getUser(jwt);
        if (!error && data?.user) adminId = data.user.id;
      }
    } catch (_) {}

    if (!adminId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await adminClient.rpc('is_admin', { user_id: adminId });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get platform settings for fees & payment info
    const { data: settingsData } = await adminClient.from('platform_settings').select('key, value');
    const settingsMap = new Map((settingsData || []).map((s: any) => [s.key, s.value]));
    const ownerFeeLrd = Number(settingsMap.get('owner_verification_fee_lrd')) || 500;
    const agentFeeUsd = Number(settingsMap.get('agent_verification_fee_usd')) || 20;
    const durationDays = Number(settingsMap.get('verification_duration_days')) || 5;
    const usdToLrd = Number(settingsMap.get('usd_to_lrd_rate')) || 192;
    const paymentInfo = settingsMap.get('payment_info') as any;

    // Get the verification request
    const { data: verReq, error: verErr } = await adminClient
      .from('verification_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (verErr || !verReq) {
      return new Response(
        JSON.stringify({ error: 'Verification request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAgentVerification = verReq.verification_type === 'agent';
    const feeUsd = isAgentVerification ? agentFeeUsd : (ownerFeeLrd / usdToLrd);
    const feeLrd = isAgentVerification ? (agentFeeUsd * usdToLrd) : ownerFeeLrd;

    // Build payment details string
    let paymentDetails = '';
    if (paymentInfo) {
      if (paymentInfo.name) paymentDetails += `Account: ${paymentInfo.name}\n`;
      if (paymentInfo.lonestar) paymentDetails += `Lonestar/MTN: ${paymentInfo.lonestar}\n`;
      if (paymentInfo.orange) paymentDetails += `Orange: ${paymentInfo.orange}\n`;
      if (paymentInfo.instructions) paymentDetails += `${paymentInfo.instructions}\n`;
    }

    if (action === 'reject') {
      // Reject verification
      await adminClient.from('verification_requests').update({
        status: 'rejected',
        admin_note: adminNote ?? null,
        admin_id: adminId,
        processed_at: new Date().toISOString(),
      }).eq('id', requestId);

      await adminClient.from('profiles').update({ verification_status: 'rejected' }).eq('id', userId);

      // Notify user
      await adminClient.from('notifications').insert({
        user_id: userId,
        title: 'Verification Rejected',
        message: `Your verification request has been rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        type: 'status_updates',
      });

      return new Response(
        JSON.stringify({ success: true, status: 'rejected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'request_payment' || action === 'request_renewal_payment') {
      // Admin requests payment from user before approving
      const isRenewal = action === 'request_renewal_payment';
      
      await adminClient.from('verification_requests').update({
        payment_status: 'payment_requested',
        payment_amount: feeUsd,
        payment_requested_at: new Date().toISOString(),
        admin_id: adminId,
        admin_note: adminNote ?? null,
      }).eq('id', requestId);

      const feeDisplay = isAgentVerification
        ? `$${agentFeeUsd} (L$${feeLrd.toLocaleString()})`
        : `L$${ownerFeeLrd.toLocaleString()} ($${feeUsd.toFixed(2)})`;

      await adminClient.from('notifications').insert({
        user_id: userId,
        title: isRenewal ? 'Renewal Payment Required' : 'Verification Payment Required',
        message: `${isRenewal ? 'Your renewal' : 'Your verification'} has been qualified! Please make a payment of ${feeDisplay} to proceed.\n\n${paymentDetails}Please include your FULL NAME as payment reference and submit the reference number via the notification on your profile.`,
        type: 'status_updates',
      });

      return new Response(
        JSON.stringify({ success: true, status: 'payment_requested' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'confirm_payment' || action === 'confirm_renewal_payment') {
      // Admin confirms payment and approves verification
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await adminClient.from('verification_requests').update({
        status: 'approved',
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        admin_id: adminId,
        admin_note: adminNote ?? null,
        processed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }).eq('id', requestId);

      await adminClient.from('profiles').update({ verification_status: 'approved' }).eq('id', userId);

      // Re-enable all user properties
      await adminClient.from('properties').update({ status: 'active' }).eq('owner_id', userId).eq('status', 'inactive');

      const isRenewal = action === 'confirm_renewal_payment';
      await adminClient.from('notifications').insert({
        user_id: userId,
        title: isRenewal ? 'Renewal Approved!' : 'Verification Approved!',
        message: `Your ${isRenewal ? 'renewal' : 'verification'} has been approved. Payment confirmed. Your verification is valid for ${durationDays} days (expires ${expiresAt.toLocaleDateString()}).`,
        type: 'status_updates',
      });

      return new Response(
        JSON.stringify({ success: true, status: 'approved', expires_at: expiresAt.toISOString() }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'request_resend') {
      // Admin requests the user to resubmit their payment reference
      await adminClient.from('verification_requests').update({
        payment_status: 'payment_requested',
        payment_reference: null,
        admin_id: adminId,
        admin_note: adminNote ?? null,
      }).eq('id', requestId);

      await adminClient.from('notifications').insert({
        user_id: userId,
        title: 'Payment Reference Required',
        message: `The admin has requested that you resubmit your payment reference. Please ensure you include your FULL NAME and the correct payment reference number.${adminNote ? `\n\nAdmin note: ${adminNote}` : ''}`,
        type: 'status_updates',
      });

      return new Response(
        JSON.stringify({ success: true, status: 'resend_requested' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      // Direct approve (legacy, shouldn't normally be used now but kept for compatibility)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await adminClient.from('verification_requests').update({
        status: 'approved',
        admin_note: adminNote ?? null,
        admin_id: adminId,
        processed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }).eq('id', requestId);

      await adminClient.from('profiles').update({ verification_status: 'approved' }).eq('id', userId);

      return new Response(
        JSON.stringify({ success: true, status: 'approved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Unexpected error:', e);
    const message = (typeof e === 'object' && e && 'message' in e) ? String((e as any).message) : 'Unexpected error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
