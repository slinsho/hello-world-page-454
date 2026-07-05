
-- Grant access to agent_leaderboard view (was missing, causing empty leaderboard)
GRANT SELECT ON public.agent_leaderboard TO anon, authenticated;
GRANT ALL ON public.agent_leaderboard TO service_role;

-- Grant access to county_insights table (was missing, causing silent failures)
GRANT SELECT ON public.county_insights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.county_insights TO authenticated;
GRANT ALL ON public.county_insights TO service_role;

-- Add new county insight fields
ALTER TABLE public.county_insights
  ADD COLUMN IF NOT EXISTS employment_rate text,
  ADD COLUMN IF NOT EXISTS avg_household_income text,
  ADD COLUMN IF NOT EXISTS avg_property_price text,
  ADD COLUMN IF NOT EXISTS clinics_count integer,
  ADD COLUMN IF NOT EXISTS parks_count integer,
  ADD COLUMN IF NOT EXISTS shopping_centers_count integer,
  ADD COLUMN IF NOT EXISTS restaurants_count integer,
  ADD COLUMN IF NOT EXISTS public_transport text,
  ADD COLUMN IF NOT EXISTS livability_score numeric(3,1);
