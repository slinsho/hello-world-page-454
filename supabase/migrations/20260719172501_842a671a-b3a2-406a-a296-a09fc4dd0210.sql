
-- 1. Hotel verification fields on verification_requests
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS business_license_no text,
  ADD COLUMN IF NOT EXISTS tin_number text,
  ADD COLUMN IF NOT EXISTS business_license_photo text,
  ADD COLUMN IF NOT EXISTS ownership_proof_photo text,
  ADD COLUMN IF NOT EXISTS hotel_name text;

-- Make id_type nullable for hotel verifications (personal ID is not required for a business)
ALTER TABLE public.verification_requests ALTER COLUMN id_type DROP NOT NULL;
ALTER TABLE public.verification_requests ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE public.verification_requests ALTER COLUMN id_images DROP NOT NULL;

-- 2. Property inspection payment fields
ALTER TABLE public.property_inspections
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

-- RPC: submit inspection payment reference (mirror of submit_verification_payment_reference)
CREATE OR REPLACE FUNCTION public.submit_inspection_payment_reference(
  p_inspection_id uuid, p_sender_name text, p_ref text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_requester uuid;
  v_pay_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT requester_id, payment_status
    INTO v_requester, v_pay_status
  FROM public.property_inspections WHERE id = p_inspection_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Inspection request not found'; END IF;
  IF v_requester IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF v_pay_status = 'confirmed' THEN RAISE EXCEPTION 'Payment already confirmed'; END IF;
  IF p_sender_name IS NULL OR length(btrim(p_sender_name)) < 2 THEN RAISE EXCEPTION 'Sender name required'; END IF;
  IF p_ref IS NULL OR length(btrim(p_ref)) < 4 THEN RAISE EXCEPTION 'Payment reference too short'; END IF;

  UPDATE public.property_inspections
     SET payment_status = 'submitted',
         payment_reference = btrim(p_sender_name) || ' - ' || btrim(p_ref),
         payment_submitted_at = now()
   WHERE id = p_inspection_id;

  -- Notify admins
  PERFORM public.notify_all_admins(
    'Inspection payment submitted',
    'A customer submitted payment for an inspection request. Please verify.',
    'status_updates',
    NULL
  );
END;
$$;

-- Admin confirm/reject payment
CREATE OR REPLACE FUNCTION public.set_inspection_payment_status(
  p_inspection_id uuid, p_status text, p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_status NOT IN ('confirmed','rejected','unpaid') THEN RAISE EXCEPTION 'Invalid status'; END IF;

  UPDATE public.property_inspections
     SET payment_status = p_status,
         payment_confirmed_at = CASE WHEN p_status='confirmed' THEN now() ELSE payment_confirmed_at END,
         admin_notes = COALESCE(p_note, admin_notes)
   WHERE id = p_inspection_id
   RETURNING requester_id INTO v_req;

  IF v_req IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_req,
      CASE WHEN p_status='confirmed' THEN 'Inspection payment confirmed'
           WHEN p_status='rejected' THEN 'Inspection payment rejected'
           ELSE 'Inspection payment updated' END,
      CASE WHEN p_status='confirmed' THEN 'Your payment was confirmed. An inspector will be assigned shortly.'
           WHEN p_status='rejected' THEN COALESCE(p_note,'Your payment could not be verified. Please resubmit.')
           ELSE 'Your inspection payment status changed.' END,
      'status_updates'
    );
  END IF;
END;
$$;

-- 3. Hotel bookings overlap guard
CREATE OR REPLACE FUNCTION public.check_hotel_booking_overlap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conflict int;
  v_blocked int;
BEGIN
  IF NEW.status IN ('cancelled','rejected') THEN RETURN NEW; END IF;
  IF NEW.check_in >= NEW.check_out THEN RAISE EXCEPTION 'Check-out must be after check-in'; END IF;

  SELECT COUNT(*) INTO v_conflict FROM public.hotel_bookings b
   WHERE b.room_id = NEW.room_id
     AND b.id IS DISTINCT FROM NEW.id
     AND b.status NOT IN ('cancelled','rejected')
     AND b.check_in < NEW.check_out
     AND b.check_out > NEW.check_in;
  IF v_conflict > 0 THEN RAISE EXCEPTION 'These dates are already booked for this room'; END IF;

  SELECT COUNT(*) INTO v_blocked FROM public.room_availability ra
   WHERE ra.room_id = NEW.room_id
     AND ra.is_blocked = true
     AND ra.date >= NEW.check_in
     AND ra.date < NEW.check_out;
  IF v_blocked > 0 THEN RAISE EXCEPTION 'One or more nights are blocked by the hotel'; END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_hotel_booking_overlap ON public.hotel_bookings;
CREATE TRIGGER trg_check_hotel_booking_overlap
  BEFORE INSERT OR UPDATE OF check_in, check_out, room_id, status
  ON public.hotel_bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_hotel_booking_overlap();
