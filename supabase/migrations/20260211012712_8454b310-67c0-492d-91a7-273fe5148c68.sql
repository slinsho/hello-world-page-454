-- Fix the ambiguous "filters" column reference in the trigger function
CREATE OR REPLACE FUNCTION public.notify_saved_search_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    -- Check property_type filter
    IF search_filters->>'propertyType' IS NOT NULL 
       AND search_filters->>'propertyType' != '' 
       AND search_filters->>'propertyType' != NEW.property_type::text THEN
      CONTINUE;
    END IF;

    -- Check listing_type filter
    IF search_filters->>'listingType' IS NOT NULL 
       AND search_filters->>'listingType' != '' 
       AND search_filters->>'listingType' != NEW.listing_type::text THEN
      CONTINUE;
    END IF;

    -- Check county filter
    IF search_filters->>'county' IS NOT NULL 
       AND search_filters->>'county' != '' 
       AND search_filters->>'county' != NEW.county THEN
      CONTINUE;
    END IF;

    -- Check min price
    IF (search_filters->>'minPrice') IS NOT NULL 
       AND (search_filters->>'minPrice')::numeric > 0 
       AND NEW.price_usd < (search_filters->>'minPrice')::numeric THEN
      CONTINUE;
    END IF;

    -- Check max price
    IF (search_filters->>'maxPrice') IS NOT NULL 
       AND (search_filters->>'maxPrice')::numeric > 0 
       AND NEW.price_usd > (search_filters->>'maxPrice')::numeric THEN
      CONTINUE;
    END IF;

    -- Skip notifying the property owner about their own listing
    IF saved.user_id = NEW.owner_id THEN
      CONTINUE;
    END IF;

    -- Insert notification
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
$$;