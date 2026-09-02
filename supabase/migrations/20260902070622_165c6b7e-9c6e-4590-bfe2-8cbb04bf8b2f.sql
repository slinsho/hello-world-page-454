CREATE OR REPLACE FUNCTION public.get_occupied_room_units(_room_id uuid, _in date, _out date)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.room_unit_id
  FROM public.hotel_bookings b
  WHERE b.room_id = _room_id
    AND b.room_unit_id IS NOT NULL
    AND b.status NOT IN ('cancelled','rejected','no_show')
    AND b.check_in < _out
    AND b.check_out > _in;
$$;

REVOKE ALL ON FUNCTION public.get_occupied_room_units(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_occupied_room_units(uuid, date, date) TO anon, authenticated, service_role;