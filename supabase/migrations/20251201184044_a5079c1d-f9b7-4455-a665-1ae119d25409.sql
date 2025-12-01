-- Add county and address columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS address text;