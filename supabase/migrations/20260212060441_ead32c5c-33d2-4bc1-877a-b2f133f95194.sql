
-- Create property_offers table for Make an Offer feature
CREATE TABLE public.property_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id),
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  offer_amount_usd NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  counter_amount_usd NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_offers ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an offer
CREATE POLICY "Anyone can submit offers"
ON public.property_offers FOR INSERT
WITH CHECK (true);

-- Property owners can view offers on their properties
CREATE POLICY "Owners can view offers on their properties"
ON public.property_offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_offers.property_id AND p.owner_id = auth.uid()
  )
  OR buyer_id = auth.uid()
  OR is_admin(auth.uid())
);

-- Property owners can update offers (accept/reject/counter)
CREATE POLICY "Owners can update offers"
ON public.property_offers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_offers.property_id AND p.owner_id = auth.uid()
  )
);

-- Buyers can delete their own pending offers
CREATE POLICY "Buyers can delete own pending offers"
ON public.property_offers FOR DELETE
USING (buyer_id = auth.uid() AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_property_offers_updated_at
BEFORE UPDATE ON public.property_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
