
-- Add payment fields to promotion_requests
ALTER TABLE public.promotion_requests 
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS payment_requested_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamp with time zone DEFAULT NULL;

-- Add comment: payment_status can be 'none', 'requested', 'paid', 'confirmed'
