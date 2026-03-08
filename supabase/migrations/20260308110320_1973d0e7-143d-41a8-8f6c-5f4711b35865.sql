CREATE POLICY "Admins can delete promotion requests"
ON public.promotion_requests
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Also allow users to update their own promotion requests (for submitting payment reference)
CREATE POLICY "Users can update own promotion requests"
ON public.promotion_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);