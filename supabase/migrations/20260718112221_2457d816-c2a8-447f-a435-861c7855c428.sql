
CREATE OR REPLACE FUNCTION public.expire_my_verification_if_due()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  -- If any approved verification request for me is past its expires_at, expire it.
  IF EXISTS (
    SELECT 1 FROM public.verification_requests
    WHERE user_id = v_uid
      AND status = 'approved'
      AND expires_at IS NOT NULL
      AND expires_at < now()
  ) THEN
    UPDATE public.verification_requests
    SET status = 'expired'
    WHERE user_id = v_uid
      AND status = 'approved'
      AND expires_at IS NOT NULL
      AND expires_at < now();

    UPDATE public.profiles
    SET verification_status = 'expired'
    WHERE id = v_uid;

    UPDATE public.properties
    SET status = 'inactive'
    WHERE owner_id = v_uid AND status = 'active';

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_uid, 'Verification Expired',
      'Your verification has expired. Your properties are now hidden. Please renew your verification to make them visible again.',
      'status_updates');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_my_verification_if_due() TO authenticated;
