
-- Add notification type column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'status_updates';

-- Create a trigger that checks preferences before inserting notifications
CREATE OR REPLACE FUNCTION public.check_notification_preference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user wants this type of notification
  IF NOT public.user_wants_notification(NEW.user_id, NEW.type) THEN
    RETURN NULL; -- Cancel the insert
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER check_notification_preference_trigger
  BEFORE INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_notification_preference();
