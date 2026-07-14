
-- Room availability
CREATE TABLE public.room_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.hotel_rooms(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  price_override numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, date)
);
GRANT SELECT ON public.room_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_availability TO authenticated;
GRANT ALL ON public.room_availability TO service_role;
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read availability" ON public.room_availability FOR SELECT USING (true);
CREATE POLICY "Owners manage availability" ON public.room_availability FOR ALL
  USING (EXISTS (SELECT 1 FROM public.hotel_rooms r JOIN public.hotels h ON h.id = r.hotel_id WHERE r.id = room_availability.room_id AND h.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hotel_rooms r JOIN public.hotels h ON h.id = r.hotel_id WHERE r.id = room_availability.room_id AND h.owner_id = auth.uid()));

-- Pricing rules
CREATE TABLE public.hotel_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL UNIQUE REFERENCES public.hotels(id) ON DELETE CASCADE,
  weekend_surcharge_pct numeric NOT NULL DEFAULT 0,
  weekend_days integer[] NOT NULL DEFAULT ARRAY[5,6],
  los_discount_pct numeric NOT NULL DEFAULT 0,
  los_min_nights integer NOT NULL DEFAULT 7,
  early_bird_pct numeric NOT NULL DEFAULT 0,
  early_bird_days integer NOT NULL DEFAULT 30,
  last_minute_pct numeric NOT NULL DEFAULT 0,
  last_minute_days integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hotel_pricing_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_pricing_rules TO authenticated;
GRANT ALL ON public.hotel_pricing_rules TO service_role;
ALTER TABLE public.hotel_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pricing rules" ON public.hotel_pricing_rules FOR SELECT USING (true);
CREATE POLICY "Owners manage pricing rules" ON public.hotel_pricing_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_pricing_rules.hotel_id AND h.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_pricing_rules.hotel_id AND h.owner_id = auth.uid()));

-- Hotel reviews
CREATE TABLE public.hotel_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.hotel_bookings(id) ON DELETE SET NULL,
  guest_id uuid,
  guest_name text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  owner_reply text,
  owner_reply_at timestamptz,
  is_flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hotel_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_reviews TO authenticated;
GRANT ALL ON public.hotel_reviews TO service_role;
ALTER TABLE public.hotel_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON public.hotel_reviews FOR SELECT USING (true);
CREATE POLICY "Guests create own review" ON public.hotel_reviews FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());
CREATE POLICY "Guests update own review" ON public.hotel_reviews FOR UPDATE TO authenticated
  USING (guest_id = auth.uid());
CREATE POLICY "Owners can reply/flag" ON public.hotel_reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_reviews.hotel_id AND h.owner_id = auth.uid()));

-- Bookings columns
ALTER TABLE public.hotel_bookings
  ADD COLUMN IF NOT EXISTS check_in_code text,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_out_at timestamptz;

-- Rooms 360 tour
ALTER TABLE public.hotel_rooms
  ADD COLUMN IF NOT EXISTS tour_360_url text;
