REVOKE EXECUTE ON FUNCTION public.is_hotel_staff(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.my_staff_hotel_ids() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_hotel_staff(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_staff_hotel_ids() TO authenticated, service_role;