// Backend function to approve/reject user verification requests securely
// Uses service role to bypass RLS and update both verification_requests and profiles

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  requestId: string;
  userId: string;
  action: 'approve' | 'reject';
  adminNote?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, userId, action, adminNote }: RequestBody = await req.json();

    if (!requestId || !userId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, userId, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing URL or service role key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get the admin user performing this action (from Authorization header)
    let adminId: string | null = null;
    try {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      const jwt = authHeader?.replace('Bearer ', '');
      if (jwt) {
        const { data, error } = await adminClient.auth.getUser(jwt);
        if (!error && data?.user) {
          adminId = data.user.id;
        }
      }
    } catch (_) {
      // Could not resolve admin id
    }

    // Require authentication
    if (!adminId) {
      console.error('Authentication required');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin authorization
    const { data: isAdmin, error: adminCheckError } = await adminClient.rpc('is_admin', { 
      user_id: adminId 
    });

    if (adminCheckError) {
      console.error('Error checking admin status:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.error('User is not an admin:', adminId);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin authorization verified:', adminId);

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // 1) Update verification request
    const { error: reqUpdateError } = await adminClient
      .from('verification_requests')
      .update({
        status: newStatus,
        admin_note: adminNote ?? null,
        admin_id: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (reqUpdateError) {
      console.error('Error updating verification_requests:', reqUpdateError);
      return new Response(
        JSON.stringify({ error: `Failed to update verification request: ${reqUpdateError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Update profile verification status
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ verification_status: newStatus })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profiles:', profileError);
      return new Response(
        JSON.stringify({ error: `Failed to update profile: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Unexpected error in process-verification:', e);
    const message = (typeof e === 'object' && e && 'message' in e)
      ? String((e as any).message)
      : 'Unexpected error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
