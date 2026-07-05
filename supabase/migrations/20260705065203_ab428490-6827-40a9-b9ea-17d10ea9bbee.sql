
-- 1) Buyer verification flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS buyer_verified boolean NOT NULL DEFAULT false;

-- 2) County insights table
CREATE TABLE IF NOT EXISTS public.county_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county text NOT NULL UNIQUE,
  overview text,
  population text,
  schools_count integer,
  hospitals_count integer,
  markets_count integer,
  highlights text[] NOT NULL DEFAULT '{}',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.county_insights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.county_insights TO authenticated;
GRANT ALL ON public.county_insights TO service_role;

ALTER TABLE public.county_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "county_insights readable by everyone"
  ON public.county_insights FOR SELECT
  USING (true);

CREATE POLICY "county_insights admin insert"
  ON public.county_insights FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "county_insights admin update"
  ON public.county_insights FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "county_insights admin delete"
  ON public.county_insights FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_county_insights_updated_at
  BEFORE UPDATE ON public.county_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all 15 counties
INSERT INTO public.county_insights (county) VALUES
  ('Bomi'),('Bong'),('Gbarpolu'),('Grand Bassa'),('Grand Cape Mount'),
  ('Grand Gedeh'),('Grand Kru'),('Lofa'),('Margibi'),('Maryland'),
  ('Montserrado'),('Nimba'),('River Cess'),('River Gee'),('Sinoe')
ON CONFLICT (county) DO NOTHING;

-- 3) Agent leaderboard view
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
JOIN public.verification_requests vr
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
) pv ON pv.owner_id = p.id;

GRANT SELECT ON public.agent_leaderboard TO anon, authenticated;
