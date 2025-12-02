-- Allow anyone to view basic profile info for property owners (for property detail pages)
CREATE POLICY "Anyone can view property owner profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.owner_id = profiles.id 
    AND properties.status = 'active'
  )
);