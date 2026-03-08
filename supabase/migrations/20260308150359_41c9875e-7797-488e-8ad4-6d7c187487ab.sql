-- Add verification payment and expiry columns to verification_requests
ALTER TABLE verification_requests
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS payment_amount numeric,
ADD COLUMN IF NOT EXISTS payment_reference text,
ADD COLUMN IF NOT EXISTS payment_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_renewal boolean NOT NULL DEFAULT false;

-- Add verification_expired status to the enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'verification_status')) THEN
    ALTER TYPE verification_status ADD VALUE 'expired';
  END IF;
END$$;