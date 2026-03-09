-- Allow a user to submit their verification payment reference safely without granting broad UPDATE rights
CREATE OR REPLACE FUNCTION public.submit_verification_payment_reference(
  p_request_id uuid,
  p_sender_name text,
  p_ref text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_payment_status text;
  v_status public.verification_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id, payment_status, status
    INTO v_user_id, v_payment_status, v_status
  FROM public.verification_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF v_status <> 'pending'::public.verification_status THEN
    RAISE EXCEPTION 'Verification request is not pending';
  END IF;

  IF v_payment_status <> 'payment_requested' THEN
    RAISE EXCEPTION 'Payment is not currently requested';
  END IF;

  IF p_sender_name IS NULL OR length(btrim(p_sender_name)) < 2 THEN
    RAISE EXCEPTION 'Sender name required';
  END IF;

  IF p_ref IS NULL OR length(btrim(p_ref)) < 4 THEN
    RAISE EXCEPTION 'Payment reference too short';
  END IF;

  UPDATE public.verification_requests
  SET payment_status = 'submitted',
      payment_reference = btrim(p_sender_name) || ' - ' || btrim(p_ref)
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_verification_payment_reference(uuid, text, text) TO authenticated;
