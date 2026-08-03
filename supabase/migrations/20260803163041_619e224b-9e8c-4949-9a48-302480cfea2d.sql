-- 1) Remove the over-broad public profile row policy
DROP POLICY IF EXISTS "Public can view safe profile fields of active owners" ON public.profiles;

-- 2) Safe public projection of profiles (no email/phone/address)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  id, name, role, profile_photo_url, cover_photo_url,
  verification_status, buyer_verified, county, bio,
  social_facebook, social_instagram, social_twitter, social_linkedin, social_whatsapp,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT ALL ON public.profiles_public TO service_role;

-- 3) Hide visitor PII columns on property_views from client roles
REVOKE SELECT ON public.property_views FROM anon, authenticated;
GRANT SELECT (id, property_id, viewer_id, viewed_at) ON public.property_views TO anon, authenticated;
GRANT INSERT ON public.property_views TO anon, authenticated;
GRANT ALL ON public.property_views TO service_role;

-- 4) Allow admins to create notifications for any user
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));