ALTER TABLE public.hotel_bookings
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.hotel_room_units
  ADD COLUMN IF NOT EXISTS housekeeping_status text NOT NULL DEFAULT 'clean';

DO $$ BEGIN
  ALTER TABLE public.hotel_room_units ADD CONSTRAINT hotel_room_units_housekeeping_chk
    CHECK (housekeeping_status IN ('clean','dirty','out_of_service'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.hotel_bookings ADD CONSTRAINT hotel_bookings_refund_status_chk
    CHECK (refund_status IN ('none','pending','refunded','not_eligible'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Guests may cancel their own bookings (updates already allowed for hotel side)
DO $$ BEGIN
  CREATE POLICY "Guests can cancel their own bookings"
  ON public.hotel_bookings FOR UPDATE TO authenticated
  USING (guest_id = auth.uid()) WITH CHECK (guest_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;