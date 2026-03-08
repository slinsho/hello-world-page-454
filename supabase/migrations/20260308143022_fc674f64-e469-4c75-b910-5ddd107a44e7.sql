ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS default_listing_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS default_property_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS default_sort_order text NOT NULL DEFAULT 'newest';