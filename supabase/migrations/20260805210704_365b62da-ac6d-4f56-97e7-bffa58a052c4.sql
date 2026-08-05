CREATE OR REPLACE FUNCTION public.notify_on_review_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hotel_name text;
BEGIN
  IF NEW.owner_reply IS NOT NULL
     AND btrim(NEW.owner_reply) <> ''
     AND NEW.owner_reply IS DISTINCT FROM OLD.owner_reply
     AND NEW.guest_id IS NOT NULL THEN
    SELECT name INTO v_hotel_name FROM public.hotels WHERE id = NEW.hotel_id;
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.guest_id,
      'The hotel replied to your review',
      COALESCE(v_hotel_name, 'The hotel') || ' replied: "' ||
        left(btrim(NEW.owner_reply), 140) ||
        CASE WHEN length(btrim(NEW.owner_reply)) > 140 THEN '…' ELSE '' END || '"',
      'status_updates'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_review_reply ON public.hotel_reviews;
CREATE TRIGGER trg_notify_review_reply
AFTER UPDATE ON public.hotel_reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_on_review_reply();