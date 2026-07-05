CREATE OR REPLACE VIEW public.agent_leaderboard
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.county,
  p.profile_photo_url,
  p.phone,
  p.bio,
  vr.agency_name,
  vr.agency_logo,
  COALESCE(prop.active_listings, 0)::int AS active_listings,
  COALESCE(rev.avg_rating, 0)::numeric(3,2) AS avg_rating,
  COALESCE(rev.reviews_count, 0)::int AS reviews_count,
  COALESCE(pv.total_views, 0)::int AS total_views,
  (
    COALESCE(prop.active_listings, 0) * 3
    + COALESCE(rev.avg_rating, 0) * COALESCE(rev.reviews_count, 0) * 5
    + COALESCE(pv.total_views, 0)
  )::int AS score
FROM public.profiles p
LEFT JOIN public.verification_requests vr
  ON vr.user_id = p.id
  AND vr.verification_type = 'agent'
  AND vr.status = 'approved'::verification_status
LEFT JOIN (
  SELECT owner_id, COUNT(*)::int AS active_listings
  FROM public.properties
  WHERE status = 'active'
  GROUP BY owner_id
) prop ON prop.owner_id = p.id
LEFT JOIN (
  SELECT r.reviewed_user_id AS user_id,
         AVG(r.rating)::numeric(3,2) AS avg_rating,
         COUNT(*)::int AS reviews_count
  FROM public.reviews r
  GROUP BY r.reviewed_user_id
) rev ON rev.user_id = p.id
LEFT JOIN (
  SELECT pr.owner_id, COUNT(*)::int AS total_views
  FROM public.property_views v
  JOIN public.properties pr ON pr.id = v.property_id
  GROUP BY pr.owner_id
) pv ON pv.owner_id = p.id
WHERE p.role = 'agent'::user_role;

GRANT SELECT ON public.agent_leaderboard TO anon, authenticated;