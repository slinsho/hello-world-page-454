
-- 1. Extend hotels table
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS total_rooms integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS check_in_time text NOT NULL DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS check_out_time text NOT NULL DEFAULT '11:00',
  ADD COLUMN IF NOT EXISTS why_guests_love jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS top_amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS about text,
  ADD COLUMN IF NOT EXISTS nearby_places jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Booking notification trigger (SECURITY DEFINER bypasses notifications INSERT RLS)
CREATE OR REPLACE FUNCTION public.notify_on_hotel_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_hotel_name text;
BEGIN
  SELECT owner_id, name INTO v_owner, v_hotel_name FROM public.hotels WHERE id = NEW.hotel_id;

  IF TG_OP = 'INSERT' THEN
    IF v_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        v_owner,
        'New booking request',
        COALESCE(NEW.guest_name,'A guest') || ' booked ' || COALESCE(v_hotel_name,'your hotel')
          || ' (' || NEW.check_in::text || ' → ' || NEW.check_out::text || ')',
        'status_updates'
      );
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.guest_id IS NOT NULL THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.guest_id, 'Booking confirmed',
        'Your booking at ' || COALESCE(v_hotel_name,'the hotel') || ' has been confirmed.',
        'status_updates');
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.guest_id, 'Booking cancelled',
        'Your booking at ' || COALESCE(v_hotel_name,'the hotel') || ' was cancelled.',
        'status_updates');
    END IF;
  END IF;

  IF NEW.checked_out_at IS NOT NULL AND OLD.checked_out_at IS NULL AND NEW.guest_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.guest_id, 'How was your stay?',
      'You checked out of ' || COALESCE(v_hotel_name,'the hotel') || '. Tap to leave a review.',
      'status_updates');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_hotel_booking_ins ON public.hotel_bookings;
DROP TRIGGER IF EXISTS trg_notify_hotel_booking_upd ON public.hotel_bookings;

CREATE TRIGGER trg_notify_hotel_booking_ins
AFTER INSERT ON public.hotel_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_hotel_booking();

CREATE TRIGGER trg_notify_hotel_booking_upd
AFTER UPDATE ON public.hotel_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_hotel_booking();
