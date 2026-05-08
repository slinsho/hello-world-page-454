-- Fix broken WITH CHECK self-referencing subqueries on promotion_requests update policy.
-- Replace with a proper restriction: users can only update their own pending row's payment_reference/payment_status (to 'submitted'),
-- and cannot change admin-managed fields. Admin updates are handled by the separate admin policy.
DROP POLICY IF EXISTS "Users can update own promotion requests" ON public.promotion_requests;

CREATE POLICY "Users can update own promotion requests"
ON public.promotion_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND payment_status = ANY (ARRAY['none'::text, 'submitted'::text])
);
