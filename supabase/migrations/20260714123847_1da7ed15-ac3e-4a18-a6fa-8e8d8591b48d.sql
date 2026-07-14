
ALTER TABLE public.property_inspections
  ADD COLUMN IF NOT EXISTS inspector_name text,
  ADD COLUMN IF NOT EXISTS inspector_phone text,
  ADD COLUMN IF NOT EXISTS report_url text,
  ADD COLUMN IF NOT EXISTS report_photos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS report_video_url text,
  ADD COLUMN IF NOT EXISTS report_notes text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
