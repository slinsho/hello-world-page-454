-- Extend property_type enum
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'land';

-- Add land-specific optional columns
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS land_size numeric,
  ADD COLUMN IF NOT EXISTS land_size_unit text,
  ADD COLUMN IF NOT EXISTS land_use text,
  ADD COLUMN IF NOT EXISTS road_access boolean,
  ADD COLUMN IF NOT EXISTS title_deed_status text,
  ADD COLUMN IF NOT EXISTS utilities_nearby text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS zoning text,
  ADD COLUMN IF NOT EXISTS topography text,
  ADD COLUMN IF NOT EXISTS boundary_marked boolean,
  ADD COLUMN IF NOT EXISTS nearest_landmark text;

-- Validation constraints (lightweight, not breaking existing rows)
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_land_size_unit_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_land_size_unit_check
  CHECK (land_size_unit IS NULL OR land_size_unit IN ('lots','acres','sqm','hectares'));

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_land_use_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_land_use_check
  CHECK (land_use IS NULL OR land_use IN ('residential','commercial','agricultural','mixed','industrial'));

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_title_deed_status_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_title_deed_status_check
  CHECK (title_deed_status IS NULL OR title_deed_status IN ('deeded','tribal','public','disputed','unknown'));

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_topography_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_topography_check
  CHECK (topography IS NULL OR topography IN ('flat','hilly','swampy','mixed','sloped'));

-- Index to speed up Reels feed query (active + has video + promoted/verified)
CREATE INDEX IF NOT EXISTS idx_properties_reels
  ON public.properties (is_promoted, updated_at DESC)
  WHERE status = 'active' AND array_length(videos, 1) > 0;