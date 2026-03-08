CREATE POLICY "Admins can update properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));