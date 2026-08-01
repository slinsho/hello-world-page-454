CREATE OR REPLACE FUNCTION public.sync_hotel_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hotel uuid := COALESCE(NEW.hotel_id, OLD.hotel_id);
BEGIN
  UPDATE public.hotels h
     SET star_rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM public.hotel_reviews r WHERE r.hotel_id = v_hotel), 0),
         rating_count = (SELECT COUNT(*) FROM public.hotel_reviews r WHERE r.hotel_id = v_hotel)
   WHERE h.id = v_hotel;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_hotel_rating ON public.hotel_reviews;
CREATE TRIGGER trg_sync_hotel_rating
AFTER INSERT OR UPDATE OR DELETE ON public.hotel_reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_hotel_rating();