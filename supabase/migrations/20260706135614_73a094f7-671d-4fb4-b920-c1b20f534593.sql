
-- 1. Indexes for scale
CREATE INDEX IF NOT EXISTS idx_saved_searches_notify
  ON public.saved_searches (notify_new_matches) WHERE notify_new_matches = true;

CREATE INDEX IF NOT EXISTS idx_notifications_cleanup
  ON public.notifications (is_read, created_at) WHERE is_read = true;

-- 2. Rewrite notify_saved_search_matches with SQL push-down
CREATE OR REPLACE FUNCTION public.notify_saved_search_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO notifications (user_id, title, message, property_id)
  SELECT ss.user_id,
         'New Property Match!',
         'A new property "' || NEW.title || '" matches your saved search "' || ss.name || '".',
         NEW.id
  FROM public.saved_searches ss
  WHERE ss.notify_new_matches = true
    AND ss.user_id <> NEW.owner_id
    AND (COALESCE(ss.filters->>'propertyType','') = '' OR ss.filters->>'propertyType' = NEW.property_type::text)
    AND (COALESCE(ss.filters->>'listingType','') = '' OR ss.filters->>'listingType' = NEW.listing_type::text)
    AND (COALESCE(ss.filters->>'county','') = '' OR ss.filters->>'county' = NEW.county)
    AND (COALESCE((ss.filters->>'minPrice')::numeric, 0) = 0 OR NEW.price_usd >= (ss.filters->>'minPrice')::numeric)
    AND (COALESCE((ss.filters->>'maxPrice')::numeric, 0) = 0 OR NEW.price_usd <= (ss.filters->>'maxPrice')::numeric)
    AND public.user_wants_notification(ss.user_id, 'status_updates');
  RETURN NEW;
END;
$function$;

-- 3. Rate limiting triggers
CREATE OR REPLACE FUNCTION public.rate_limit_inquiries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.sender_id IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_count FROM public.property_inquiries
      WHERE sender_id = NEW.sender_id AND created_at > now() - interval '10 minutes';
    IF recent_count >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending more inquiries.';
    END IF;
  ELSE
    SELECT COUNT(*) INTO recent_count FROM public.property_inquiries
      WHERE property_id = NEW.property_id
        AND created_at > now() - interval '1 hour'
        AND (
          (NEW.sender_email IS NOT NULL AND sender_email = NEW.sender_email)
          OR (NEW.sender_phone IS NOT NULL AND sender_phone = NEW.sender_phone)
        );
    IF recent_count >= 3 THEN
      RAISE EXCEPTION 'Too many inquiries on this property. Please try again later.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rate_limit_inquiries ON public.property_inquiries;
CREATE TRIGGER trg_rate_limit_inquiries
  BEFORE INSERT ON public.property_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_inquiries();

CREATE OR REPLACE FUNCTION public.rate_limit_offers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.buyer_id IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO recent_count FROM public.property_offers
    WHERE buyer_id = NEW.buyer_id AND created_at > now() - interval '10 minutes';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before making more offers.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rate_limit_offers ON public.property_offers;
CREATE TRIGGER trg_rate_limit_offers
  BEFORE INSERT ON public.property_offers
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_offers();

CREATE OR REPLACE FUNCTION public.rate_limit_reports()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.reporter_id IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO recent_count FROM public.property_reports
    WHERE reporter_id = NEW.reporter_id AND created_at > now() - interval '10 minutes';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting more reports.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rate_limit_reports ON public.property_reports;
CREATE TRIGGER trg_rate_limit_reports
  BEFORE INSERT ON public.property_reports
  FOR EACH ROW EXECUTE FUNCTION public.rate_limit_reports();

-- 4. Daily cleanup of read notifications >30 days
SELECT cron.schedule(
  'cleanup-old-read-notifications',
  '0 3 * * *',
  $$ DELETE FROM public.notifications WHERE is_read = true AND created_at < now() - interval '30 days'; $$
);
