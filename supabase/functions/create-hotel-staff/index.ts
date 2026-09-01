import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Not authenticated' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401)
    const callerId = userData.user.id

    const body = await req.json().catch(() => ({}))
    const hotelId = String(body.hotel_id || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const fullName = String(body.full_name || '').trim()

    if (!hotelId) return json({ error: 'Hotel is required' }, 400)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Enter a valid email address' }, 400)
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)
    if (fullName.length < 2) return json({ error: 'Enter the receptionist name' }, 400)

    // Caller must own the hotel, or be a platform admin.
    const { data: hotel } = await admin.from('hotels').select('id, owner_id, name').eq('id', hotelId).maybeSingle()
    if (!hotel) return json({ error: 'Hotel not found' }, 404)

    let allowed = hotel.owner_id === callerId
    if (!allowed) {
      const { data: isAdmin } = await admin.rpc('is_admin', { user_id: callerId })
      allowed = !!isAdmin
    }
    if (!allowed) return json({ error: 'You can only add staff to your own hotel' }, 403)

    // Create the receptionist auth account (email confirmed so they can sign in right away).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: fullName, role: 'receptionist' },
    })
    if (createErr || !created?.user) {
      return json({ error: createErr?.message || 'Could not create the account' }, 400)
    }

    const staffId = created.user.id

    const { error: staffErr } = await admin.from('hotel_staff').insert({
      hotel_id: hotelId,
      user_id: staffId,
      staff_role: 'receptionist',
      full_name: fullName,
      email,
      created_by: callerId,
    })
    if (staffErr) {
      await admin.auth.admin.deleteUser(staffId)
      return json({ error: staffErr.message }, 400)
    }

    // Make sure the profile carries the receptionist role.
    await admin.from('profiles').update({ role: 'receptionist', name: fullName }).eq('id', staffId)

    return json({ success: true, user_id: staffId })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    console.error('create-hotel-staff error:', message)
    return json({ error: message }, 500)
  }
})
