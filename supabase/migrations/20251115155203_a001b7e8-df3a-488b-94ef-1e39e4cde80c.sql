-- Add videos column to properties table
ALTER TABLE public.properties 
ADD COLUMN videos text[] DEFAULT '{}';

COMMENT ON COLUMN public.properties.videos IS 'Array of video URLs for the property';