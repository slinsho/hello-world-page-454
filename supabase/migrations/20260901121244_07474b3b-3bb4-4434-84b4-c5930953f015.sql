-- 1. Receptionist role on profiles
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'receptionist';

-- 2. Hotel staff
CREATE TABLE IF NOT EXISTS public.hotel_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  staff_role text NOT NULL DEFAULT 'receptionist',
  full_name text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_staff TO authenticated;
GRANT ALL ON public.hotel_staff TO service_role;

ALTER TABLE public.hotel_staff ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_hotel_staff(_user_id uuid, _hotel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_staff s
    WHERE s.user_id = _user_id AND s.hotel_id = _hotel_id AND s.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.my_staff_hotel_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hotel_id FROM public.hotel_staff
  WHERE user_id = auth.uid() AND is_active = true;
$$;

CREATE POLICY "Staff can view own record"
ON public.hotel_staff FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid())
);

CREATE POLICY "Hotel owner manages staff"
ON public.hotel_staff FOR ALL TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid())
);

CREATE TRIGGER hotel_staff_updated_at BEFORE UPDATE ON public.hotel_staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Individual room numbers (units)
CREATE TABLE IF NOT EXISTS public.hotel_room_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.hotel_rooms(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  floor text,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, room_number)
);

GRANT SELECT ON public.hotel_room_units TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_room_units TO authenticated;
GRANT ALL ON public.hotel_room_units TO service_role;

ALTER TABLE public.hotel_room_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room numbers are viewable by everyone"
ON public.hotel_room_units FOR SELECT
USING (true);

CREATE POLICY "Hotel owner or staff manage room numbers"
ON public.hotel_room_units FOR ALL TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.is_hotel_staff(auth.uid(), hotel_id)
  OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR public.is_hotel_staff(auth.uid(), hotel_id)
  OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid())
);

CREATE TRIGGER hotel_room_units_updated_at BEFORE UPDATE ON public.hotel_room_units
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Bookings: exact room number + no-show tracking
ALTER TABLE public.hotel_bookings
  ADD COLUMN IF NOT EXISTS room_unit_id uuid REFERENCES public.hotel_room_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_room_unit ON public.hotel_bookings(room_unit_id);
CREATE INDEX IF NOT EXISTS idx_hotel_room_units_room ON public.hotel_room_units(room_id);

-- 5. Overlap check now works per room number when one is chosen
CREATE OR REPLACE FUNCTION public.check_hotel_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_conflict int;
  v_blocked int;
BEGIN
  IF NEW.status IN ('cancelled','rejected','no_show') THEN RETURN NEW; END IF;
  IF NEW.check_in >= NEW.check_out THEN RAISE EXCEPTION 'Check-out must be after check-in'; END IF;

  IF NEW.room_unit_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_conflict FROM public.hotel_bookings b
     WHERE b.room_unit_id = NEW.room_unit_id
       AND b.id IS DISTINCT FROM NEW.id
       AND b.status NOT IN ('cancelled','rejected','no_show')
       AND b.check_in < NEW.check_out
       AND b.check_out > NEW.check_in;
    IF v_conflict > 0 THEN RAISE EXCEPTION 'That room number is already booked for these dates'; END IF;
  ELSE
    SELECT COUNT(*) INTO v_conflict FROM public.hotel_bookings b
     WHERE b.room_id = NEW.room_id
       AND b.room_unit_id IS NULL
       AND b.id IS DISTINCT FROM NEW.id
       AND b.status NOT IN ('cancelled','rejected','no_show')
       AND b.check_in < NEW.check_out
       AND b.check_out > NEW.check_in;
    IF v_conflict > 0 THEN RAISE EXCEPTION 'These dates are already booked for this room'; END IF;
  END IF;

  SELECT COUNT(*) INTO v_blocked FROM public.room_availability ra
   WHERE ra.room_id = NEW.room_id
     AND ra.is_blocked = true
     AND ra.date >= NEW.check_in
     AND ra.date < NEW.check_out;
  IF v_blocked > 0 THEN RAISE EXCEPTION 'One or more nights are blocked by the hotel'; END IF;

  RETURN NEW;
END;
$function$;

-- 6. Staff access to their hotel's bookings
CREATE POLICY "Hotel staff can view bookings"
ON public.hotel_bookings FOR SELECT TO authenticated
USING (public.is_hotel_staff(auth.uid(), hotel_id));

CREATE POLICY "Hotel staff can update bookings"
ON public.hotel_bookings FOR UPDATE TO authenticated
USING (public.is_hotel_staff(auth.uid(), hotel_id))
WITH CHECK (public.is_hotel_staff(auth.uid(), hotel_id));

-- Staff need to read their hotel + rooms
CREATE POLICY "Hotel staff can view their hotel"
ON public.hotels FOR SELECT TO authenticated
USING (public.is_hotel_staff(auth.uid(), id));

CREATE POLICY "Hotel staff can view rooms"
ON public.hotel_rooms FOR SELECT TO authenticated
USING (public.is_hotel_staff(auth.uid(), hotel_id));

-- 7. Realtime
ALTER TABLE public.hotel_bookings REPLICA IDENTITY FULL;
ALTER TABLE public.hotel_room_units REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_bookings;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_room_units;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;