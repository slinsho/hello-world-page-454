-- Fix notify_users_new_property function to use format() for safer string handling
CREATE OR REPLACE FUNCTION public.notify_users_new_property()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert notifications for all users who have properties in the same county
  INSERT INTO public.notifications (user_id, property_id, title, message)
  SELECT DISTINCT p.owner_id, NEW.id, 'New Property Near You', 
    format('A new property has been listed in %s: %s', NEW.county, NEW.title)
  FROM public.properties p
  WHERE p.county = NEW.county 
    AND p.owner_id != NEW.owner_id
    AND p.status = 'active';
  
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function to have a fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;