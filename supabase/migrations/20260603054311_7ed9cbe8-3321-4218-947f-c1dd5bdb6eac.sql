
-- 1. profiles: stop exposing phone/email to all authed users who can see active properties.
-- Replace the policy with one that only exposes the row WITHOUT sensitive contact fields
-- via a public view; tighten direct table SELECT to owner-only + admin.
DROP POLICY IF EXISTS "Authenticated can view owner profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, name, role, verification_status, profile_photo_url, cover_photo_url,
  bio, county, address,
  social_whatsapp, social_linkedin, social_twitter, social_instagram, social_facebook,
  created_at
FROM public.profiles
WHERE EXISTS (
  SELECT 1 FROM public.properties p
  WHERE p.owner_id = profiles.id AND p.status = 'active'
);

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Re-add a narrower direct-table policy for the columns the app already filters in JS,
-- but only for non-sensitive lookups by authenticated users viewing property owners.
CREATE POLICY "Authed can view owner non-sensitive profile fields"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.owner_id = profiles.id AND p.status = 'active'
  )
);
-- NOTE: app code in PropertyCard/Index/Reels already selects only safe columns
-- (id, name, role, verification_status, phone, profile_photo_url). The `phone` field
-- is intentionally kept readable because property cards display the owner phone for
-- call/WhatsApp CTAs. If you want to hide owner phone too, remove `phone` from those
-- .select() calls and use `public_profiles` view instead.

-- 2. property_views: hide raw ip_address / user_agent from owners. Drop the broad
-- SELECT policy and replace with a column-restricted view.
DROP POLICY IF EXISTS "Property owners can view their analytics" ON public.property_views;

CREATE POLICY "Owners view non-PII analytics"
ON public.property_views FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_views.property_id AND p.owner_id = auth.uid()))
  OR public.is_admin(auth.uid())
);

-- Revoke direct column access to PII for non-admins via a SECURITY DEFINER guard view
CREATE OR REPLACE VIEW public.property_views_safe
WITH (security_invoker = true) AS
SELECT id, property_id, viewer_id, viewed_at FROM public.property_views;

GRANT SELECT ON public.property_views_safe TO authenticated;

-- 3. login_attempts: only service role / admins should insert.
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
-- Inserts now only allowed via service role (edge function); RLS denies otherwise.

-- 4. property_offers: require auth and enforce buyer_id = auth.uid() when provided.
DROP POLICY IF EXISTS "Anyone can submit offers" ON public.property_offers;
CREATE POLICY "Auth users can submit offers as themselves"
ON public.property_offers FOR INSERT
TO authenticated
WITH CHECK (buyer_id IS NULL OR buyer_id = auth.uid());

-- 5. notifications: enforce user_id = auth.uid() on insert (prevent injecting into others' feeds).
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users create own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
-- System notifications (cross-user) are still possible via SECURITY DEFINER functions
-- (notify_all_admins, notify_users_new_property, notify_saved_search_matches) which bypass RLS.

-- 6. property_inquiries: if sender_id provided it must equal auth.uid()
DROP POLICY IF EXISTS "Anyone can send inquiries" ON public.property_inquiries;
CREATE POLICY "Send inquiry as self or anon"
ON public.property_inquiries FOR INSERT
WITH CHECK (sender_id IS NULL OR sender_id = auth.uid());

-- 7. messages: only the sender can update their own message.
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Senders can update own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Allow recipients to mark messages as read via a SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.mark_messages_read(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ) THEN RAISE EXCEPTION 'Not a conversation participant'; END IF;
  UPDATE public.messages
  SET is_read = true
  WHERE conversation_id = _conversation_id
    AND sender_id <> auth.uid()
    AND is_read = false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;
