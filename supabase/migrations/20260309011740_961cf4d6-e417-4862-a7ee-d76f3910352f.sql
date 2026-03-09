-- Fix property_offers foreign key to allow user deletion
-- First drop the existing constraint
ALTER TABLE public.property_offers 
DROP CONSTRAINT IF EXISTS property_offers_buyer_id_fkey;

-- Add the constraint back with CASCADE behavior
ALTER TABLE public.property_offers
ADD CONSTRAINT property_offers_buyer_id_fkey 
FOREIGN KEY (buyer_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;