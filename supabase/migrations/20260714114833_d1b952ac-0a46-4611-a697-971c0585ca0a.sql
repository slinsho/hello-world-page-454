
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  county TEXT NOT NULL,
  district TEXT,
  city TEXT,
  address TEXT NOT NULL,
  cover_photo TEXT,
  gallery TEXT[] DEFAULT '{}',
  amenities JSONB DEFAULT '{}'::jsonb,
  star_rating NUMERIC(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hotels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotels TO authenticated;
GRANT ALL ON public.hotels TO service_role;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View active hotels" ON public.hotels FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Owners insert hotels" ON public.hotels FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update hotels" ON public.hotels FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Owners delete hotels" ON public.hotels FOR DELETE USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE TRIGGER hotels_updated_at BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_night NUMERIC(10,2) NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2,
  size_sqm INTEGER,
  bed_type TEXT,
  amenities JSONB DEFAULT '{}'::jsonb,
  photos TEXT[] DEFAULT '{}',
  is_most_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hotel_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_rooms TO authenticated;
GRANT ALL ON public.hotel_rooms TO service_role;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View rooms" ON public.hotel_rooms FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND (h.owner_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "Owners manage rooms" ON public.hotel_rooms FOR ALL USING (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND (h.owner_id = auth.uid() OR public.is_admin(auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid()));
CREATE TRIGGER hotel_rooms_updated_at BEFORE UPDATE ON public.hotel_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.hotel_rooms(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  rooms INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL,
  taxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pay_online','pay_at_hotel','mobile_money','bank_transfer')),
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_bookings TO authenticated;
GRANT ALL ON public.hotel_bookings TO service_role;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bookings" ON public.hotel_bookings FOR SELECT USING (guest_id = auth.uid() OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Create bookings" ON public.hotel_bookings FOR INSERT WITH CHECK (guest_id = auth.uid() OR guest_id IS NULL);
CREATE POLICY "Update bookings" ON public.hotel_bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = hotel_id AND h.owner_id = auth.uid()) OR public.is_admin(auth.uid()) OR guest_id = auth.uid());
CREATE POLICY "Delete bookings" ON public.hotel_bookings FOR DELETE USING (public.is_admin(auth.uid()));
CREATE TRIGGER hotel_bookings_updated_at BEFORE UPDATE ON public.hotel_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.property_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_email TEXT,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('location_availability','documents_legitimacy','help_me_buy')),
  fee_usd NUMERIC(10,2) NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','completed','rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_inspections TO authenticated;
GRANT ALL ON public.property_inspections TO service_role;
ALTER TABLE public.property_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View inspections" ON public.property_inspections FOR SELECT USING (requester_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Create inspections" ON public.property_inspections FOR INSERT WITH CHECK (requester_id = auth.uid() OR requester_id IS NULL);
CREATE POLICY "Update inspections" ON public.property_inspections FOR UPDATE USING (requester_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Delete inspections" ON public.property_inspections FOR DELETE USING (public.is_admin(auth.uid()));
CREATE TRIGGER property_inspections_updated_at BEFORE UPDATE ON public.property_inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_hotels_status ON public.hotels(status);
CREATE INDEX idx_hotels_county ON public.hotels(county);
CREATE INDEX idx_hotel_rooms_hotel ON public.hotel_rooms(hotel_id);
CREATE INDEX idx_hotel_bookings_hotel ON public.hotel_bookings(hotel_id);
CREATE INDEX idx_hotel_bookings_guest ON public.hotel_bookings(guest_id);
CREATE INDEX idx_inspections_property ON public.property_inspections(property_id);
CREATE INDEX idx_inspections_requester ON public.property_inspections(requester_id);
CREATE INDEX idx_inspections_status ON public.property_inspections(status);
