-- Performance indexes for properties (idempotent)
CREATE INDEX IF NOT EXISTS idx_properties_status_created
  ON public.properties (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_county
  ON public.properties (county) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_properties_property_type
  ON public.properties (property_type) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_properties_listing_type
  ON public.properties (listing_type) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_properties_price_usd
  ON public.properties (price_usd) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_properties_owner_id
  ON public.properties (owner_id);

CREATE INDEX IF NOT EXISTS idx_properties_promoted_active
  ON public.properties (is_promoted, updated_at DESC) WHERE status = 'active';

-- Common joins / lookups
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id
  ON public.property_inquiries (property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_offers_property_id
  ON public.property_offers (property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_user_property
  ON public.favorites (user_id, property_id);

CREATE INDEX IF NOT EXISTS idx_property_views_property_id
  ON public.property_views (property_id, viewed_at DESC);
