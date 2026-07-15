CREATE POLICY "Senders can view own inquiries" ON public.property_inquiries
FOR SELECT TO authenticated
USING (sender_id = auth.uid());