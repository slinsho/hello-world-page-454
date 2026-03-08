
-- Add duration to promotion_requests
ALTER TABLE public.promotion_requests 
ADD COLUMN IF NOT EXISTS duration_months integer DEFAULT 1;

-- Create platform_settings table for exchange rate and promotion price
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Insert default values
INSERT INTO public.platform_settings (key, value) VALUES 
  ('usd_to_lrd_rate', '192'::jsonb),
  ('promotion_price_per_month', '5'::jsonb)
ON CONFLICT (key) DO NOTHING;
