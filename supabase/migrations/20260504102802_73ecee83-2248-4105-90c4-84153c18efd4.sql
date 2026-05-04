-- 1. PROMOTION REQUESTS: prevent users from self-approving
DROP POLICY IF EXISTS "Users can update own promotion requests" ON public.promotion_requests;

CREATE POLICY "Users can update own promotion requests"
ON public.promotion_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = (SELECT status FROM public.promotion_requests WHERE id = promotion_requests.id)
  AND payment_status IN ('none','submitted')
  AND payment_confirmed_at IS NOT DISTINCT FROM (SELECT payment_confirmed_at FROM public.promotion_requests WHERE id = promotion_requests.id)
  AND admin_id IS NOT DISTINCT FROM (SELECT admin_id FROM public.promotion_requests WHERE id = promotion_requests.id)
  AND admin_note IS NOT DISTINCT FROM (SELECT admin_note FROM public.promotion_requests WHERE id = promotion_requests.id)
  AND processed_at IS NOT DISTINCT FROM (SELECT processed_at FROM public.promotion_requests WHERE id = promotion_requests.id)
);

-- 2. USER PREFERENCES: remove public-read policy
DROP POLICY IF EXISTS "Anyone can read privacy settings" ON public.user_preferences;

-- 3. PROFILES: replace public-full-row policy with safe column-restricted view
DROP POLICY IF EXISTS "Anyone can view property owner profiles" ON public.profiles;

-- Create a public view exposing only safe columns for property owners with active listings
CREATE OR REPLACE VIEW public.public_owner_profiles
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.role,
  p.verification_status,
  p.profile_photo_url,
  p.cover_photo_url,
  p.bio,
  p.county,
  p.social_facebook,
  p.social_instagram,
  p.social_twitter,
  p.social_linkedin,
  p.social_whatsapp,
  p.created_at
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.properties pr
  WHERE pr.owner_id = p.id AND pr.status = 'active'
);

-- Allow anonymous + authenticated to read this safe view
GRANT SELECT ON public.public_owner_profiles TO anon, authenticated;

-- Re-add a policy so the view (security_invoker) can read profile rows for active-listing owners,
-- but ONLY when reading via the view's SELECT (the view selects only safe columns anyway).
CREATE POLICY "Public can view owner profiles via safe view"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.owner_id = profiles.id
      AND properties.status = 'active'
  )
);
-- NOTE: Because RLS still gates the underlying table, frontend code that needs to
-- expose owner contact info must use authenticated context with explicit user
-- consent OR query the public_owner_profiles view (which omits email/phone/address).
-- To fully hide email/phone from this row-level SELECT we replace the above with a
-- column-restricted approach below.

DROP POLICY IF EXISTS "Public can view owner profiles via safe view" ON public.profiles;

-- Use column-level GRANTs: revoke broad SELECT on profiles for anon, then grant only safe columns
-- However Postgres RLS evaluates BEFORE column grants, so we instead keep RLS as authenticated-only
-- and rely on the view for anonymous access.

CREATE POLICY "Authenticated can view owner profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.owner_id = profiles.id
      AND properties.status = 'active'
  )
);

-- 4. ADMIN ACTIVITY LOGS: restrict INSERT to admins only
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.admin_activity_logs;

CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());