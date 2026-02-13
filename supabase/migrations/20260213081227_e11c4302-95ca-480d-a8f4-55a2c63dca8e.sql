
-- Add agent-specific verification fields to verification_requests
ALTER TABLE public.verification_requests 
  ADD COLUMN IF NOT EXISTS agency_name text,
  ADD COLUMN IF NOT EXISTS office_location text,
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS agency_logo text,
  ADD COLUMN IF NOT EXISTS verification_type text NOT NULL DEFAULT 'owner';

-- Add comment for clarity
COMMENT ON COLUMN public.verification_requests.verification_type IS 'owner or agent - determines which verification flow was used';
