
-- Add contact_phone_2 column to profiles for owner's second phone number
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone_2 text;
