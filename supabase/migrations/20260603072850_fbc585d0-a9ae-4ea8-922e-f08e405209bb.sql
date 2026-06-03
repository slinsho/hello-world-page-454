
-- 1) PROFILES
DROP POLICY IF EXISTS "Authed can view owner non-sensitive profile fields" ON public.profiles;
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, name, role, profile_photo_url, cover_photo_url, bio, county,
  social_facebook, social_instagram, social_twitter, social_linkedin, social_whatsapp,
  verification_status, created_at, updated_at
FROM public.profiles
WHERE EXISTS (
  SELECT 1 FROM public.properties p
  WHERE p.owner_id = profiles.id AND p.status = 'active'
);

CREATE POLICY "Public can view safe profile fields of active owners"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.owner_id = profiles.id AND p.status = 'active'
  )
);

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, name, role, profile_photo_url, cover_photo_url, bio, county,
              social_facebook, social_instagram, social_twitter, social_linkedin, social_whatsapp,
              verification_status, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
GRANT SELECT (email, phone, contact_phone_2, address) ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2) PROPERTY_VIEWS
DROP VIEW IF EXISTS public.property_views_safe;
CREATE VIEW public.property_views_safe
WITH (security_invoker = true) AS
SELECT id, property_id, viewer_id, viewed_at
FROM public.property_views;

REVOKE SELECT ON public.property_views FROM anon, authenticated;
GRANT SELECT (id, property_id, viewer_id, viewed_at) ON public.property_views TO authenticated;
GRANT INSERT ON public.property_views TO anon, authenticated;
GRANT ALL ON public.property_views TO service_role;
GRANT SELECT ON public.property_views_safe TO authenticated;

-- 3) LOGIN_ATTEMPTS
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Public can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow public insert" ON public.login_attempts;
REVOKE INSERT ON public.login_attempts FROM anon, authenticated;
GRANT ALL ON public.login_attempts TO service_role;

-- 4) PROPERTY_OFFERS — require auth + buyer_id = auth.uid()
DROP POLICY IF EXISTS "Auth users can submit offers as themselves" ON public.property_offers;
DROP POLICY IF EXISTS "Anyone can submit offers" ON public.property_offers;
CREATE POLICY "Authenticated users submit offers as themselves"
ON public.property_offers
FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- 5) PROPERTY_INQUIRIES — senders can delete own
CREATE POLICY "Senders can delete own inquiries"
ON public.property_inquiries
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());
