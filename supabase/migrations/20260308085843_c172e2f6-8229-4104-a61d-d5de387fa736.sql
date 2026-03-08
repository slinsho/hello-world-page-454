CREATE POLICY "Users can update own approved verification agency info"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'approved'::verification_status AND verification_type = 'agent')
WITH CHECK (auth.uid() = user_id AND status = 'approved'::verification_status AND verification_type = 'agent');