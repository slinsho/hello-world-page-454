
-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inquiries boolean NOT NULL DEFAULT true,
  messages boolean NOT NULL DEFAULT true,
  offers boolean NOT NULL DEFAULT true,
  status_updates boolean NOT NULL DEFAULT true,
  marketing boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to check if a user wants a specific notification type
CREATE OR REPLACE FUNCTION public.user_wants_notification(p_user_id uuid, p_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE p_type
    WHEN 'inquiries' THEN COALESCE((SELECT inquiries FROM notification_preferences WHERE user_id = p_user_id), true)
    WHEN 'messages' THEN COALESCE((SELECT messages FROM notification_preferences WHERE user_id = p_user_id), true)
    WHEN 'offers' THEN COALESCE((SELECT offers FROM notification_preferences WHERE user_id = p_user_id), true)
    WHEN 'status_updates' THEN COALESCE((SELECT status_updates FROM notification_preferences WHERE user_id = p_user_id), true)
    WHEN 'marketing' THEN COALESCE((SELECT marketing FROM notification_preferences WHERE user_id = p_user_id), false)
    ELSE true
  END
$$;

-- Update the new property notification trigger to respect preferences
CREATE OR REPLACE FUNCTION public.notify_users_new_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, property_id, title, message)
  SELECT DISTINCT p.owner_id, NEW.id, 'New Property Near You', 
    format('A new property has been listed in %s: %s', NEW.county, NEW.title)
  FROM public.properties p
  WHERE p.county = NEW.county 
    AND p.owner_id != NEW.owner_id
    AND p.status = 'active'
    AND public.user_wants_notification(p.owner_id, 'status_updates');
  
  RETURN NEW;
END;
$function$;

-- Update saved search notification trigger to respect preferences
CREATE OR REPLACE FUNCTION public.notify_saved_search_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  saved RECORD;
  search_filters JSONB;
BEGIN
  FOR saved IN
    SELECT ss.id, ss.user_id, ss.name, ss.filters AS search_filters, ss.notify_new_matches
    FROM saved_searches ss
    WHERE ss.notify_new_matches = true
  LOOP
    search_filters := saved.search_filters;

    IF search_filters->>'propertyType' IS NOT NULL 
       AND search_filters->>'propertyType' != '' 
       AND search_filters->>'propertyType' != NEW.property_type::text THEN
      CONTINUE;
    END IF;

    IF search_filters->>'listingType' IS NOT NULL 
       AND search_filters->>'listingType' != '' 
       AND search_filters->>'listingType' != NEW.listing_type::text THEN
      CONTINUE;
    END IF;

    IF search_filters->>'county' IS NOT NULL 
       AND search_filters->>'county' != '' 
       AND search_filters->>'county' != NEW.county THEN
      CONTINUE;
    END IF;

    IF (search_filters->>'minPrice') IS NOT NULL 
       AND (search_filters->>'minPrice')::numeric > 0 
       AND NEW.price_usd < (search_filters->>'minPrice')::numeric THEN
      CONTINUE;
    END IF;

    IF (search_filters->>'maxPrice') IS NOT NULL 
       AND (search_filters->>'maxPrice')::numeric > 0 
       AND NEW.price_usd > (search_filters->>'maxPrice')::numeric THEN
      CONTINUE;
    END IF;

    IF saved.user_id = NEW.owner_id THEN
      CONTINUE;
    END IF;

    -- Check notification preference
    IF NOT public.user_wants_notification(saved.user_id, 'status_updates') THEN
      CONTINUE;
    END IF;

    INSERT INTO notifications (user_id, title, message, property_id)
    VALUES (
      saved.user_id,
      'New Property Match!',
      'A new property "' || NEW.title || '" matches your saved search "' || saved.name || '".',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;
