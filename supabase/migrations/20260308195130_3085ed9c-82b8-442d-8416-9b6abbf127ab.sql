
CREATE OR REPLACE FUNCTION public.notify_all_admins(
  p_title text,
  p_message text,
  p_type text DEFAULT 'status_updates',
  p_property_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, property_id)
  SELECT ur.user_id, p_title, p_message, p_type, p_property_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
END;
$$;
