
-- Create a function that checks new properties against saved searches and notifies users
CREATE OR REPLACE FUNCTION public.notify_saved_search_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  saved RECORD;
  filters JSONB;
BEGIN
  -- Loop through all saved searches with notifications enabled
  FOR saved IN
    SELECT id, user_id, name, filters AS search_filters
    FROM public.saved_searches
    WHERE notify_new_matches = true
  LOOP
    filters := saved.search_filters;
    
    -- Check if the new property matches the saved search filters
    IF (
      -- Skip if same user
      saved.user_id != NEW.owner_id
      -- Check property type filter
      AND (filters->>'type' IS NULL OR filters->>'type' = 'all' OR filters->>'type' = '' OR filters->>'type' = NEW.property_type::text)
      -- Check listing type filter
      AND (filters->>'listing' IS NULL OR filters->>'listing' = 'all' OR filters->>'listing' = '' OR filters->>'listing' = NEW.listing_type::text)
      -- Check county filter
      AND (filters->>'county' IS NULL OR filters->>'county' = 'all' OR filters->>'county' = '' OR filters->>'county' = NEW.county)
      -- Check min price
      AND (filters->>'minPrice' IS NULL OR filters->>'minPrice' = '' OR NEW.price_usd >= (filters->>'minPrice')::numeric)
      -- Check max price
      AND (filters->>'maxPrice' IS NULL OR filters->>'maxPrice' = '' OR NEW.price_usd <= (filters->>'maxPrice')::numeric)
      -- Check bedrooms
      AND (filters->>'bedrooms' IS NULL OR filters->>'bedrooms' = '' OR 
           (filters->>'bedrooms' = '5+' AND COALESCE(NEW.bedrooms, 0) >= 5) OR
           (filters->>'bedrooms' != '5+' AND COALESCE(NEW.bedrooms, 0) >= (filters->>'bedrooms')::int))
      -- Check bathrooms
      AND (filters->>'bathrooms' IS NULL OR filters->>'bathrooms' = '' OR
           (filters->>'bathrooms' = '4+' AND COALESCE(NEW.bathrooms, 0) >= 4) OR
           (filters->>'bathrooms' != '4+' AND COALESCE(NEW.bathrooms, 0) >= (filters->>'bathrooms')::int))
    ) THEN
      -- Insert notification
      INSERT INTO public.notifications (user_id, property_id, title, message)
      VALUES (
        saved.user_id,
        NEW.id,
        'Saved Search Match',
        format('New property matching "%s": %s in %s - $%s', saved.name, NEW.title, NEW.county, NEW.price_usd::text)
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for saved search notifications
CREATE TRIGGER on_new_property_saved_search_notify
AFTER INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.notify_saved_search_matches();

-- Add content moderation fields to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderation_note text;

-- Add flagged_count to properties for content moderation
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS flagged_count int DEFAULT 0;
