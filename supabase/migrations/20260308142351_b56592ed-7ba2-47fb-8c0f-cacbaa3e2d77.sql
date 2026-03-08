
-- Create user preferences table for privacy and browsing settings
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Privacy settings
  show_phone boolean NOT NULL DEFAULT true,
  show_email boolean NOT NULL DEFAULT true,
  show_location boolean NOT NULL DEFAULT true,
  -- Browsing preferences
  default_county text DEFAULT NULL,
  currency_display text NOT NULL DEFAULT 'usd',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anyone to read privacy settings (needed to check if phone/email should be shown)
CREATE POLICY "Anyone can read privacy settings"
  ON public.user_preferences FOR SELECT
  USING (true);
