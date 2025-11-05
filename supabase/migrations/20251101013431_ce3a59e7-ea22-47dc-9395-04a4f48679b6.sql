-- Add second contact field to properties table
ALTER TABLE public.properties 
ADD COLUMN contact_phone_2 text;

COMMENT ON COLUMN public.properties.contact_phone_2 IS 'Optional second contact phone number';