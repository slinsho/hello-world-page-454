
-- Update handle_new_user to store phone and contact_phone_2 from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone, contact_phone_2)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'contact_phone_2', NULL)
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
