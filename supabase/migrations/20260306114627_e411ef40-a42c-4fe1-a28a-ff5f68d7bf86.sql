
-- Add bio column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add tsvector column for full-text search on properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(address, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(county, '')), 'C')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_properties_search_vector ON public.properties USING GIN (search_vector);
