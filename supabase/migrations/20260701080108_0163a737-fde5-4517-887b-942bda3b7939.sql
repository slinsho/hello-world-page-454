
-- Performance indexes for scaling to 20k+ users
CREATE INDEX IF NOT EXISTS idx_properties_status_created ON public.properties (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_county_status ON public.properties (county, status);
CREATE INDEX IF NOT EXISTS idx_properties_type_status ON public.properties (property_type, status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON public.properties (listing_type, status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties (price_usd);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties (owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_promoted_active ON public.properties (is_promoted) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_property_views_prop_time ON public.property_views (property_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations (participant_1, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations (participant_2, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.property_inquiries (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_property ON public.property_offers (property_id, created_at DESC);

-- Production error logging table (in-DB monitoring, no external Sentry needed)
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  level text NOT NULL DEFAULT 'error',
  message text NOT NULL,
  stack text,
  route text,
  user_agent text,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON public.error_logs (level, created_at DESC);

GRANT INSERT ON public.error_logs TO anon, authenticated;
GRANT SELECT, DELETE ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log errors" ON public.error_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view error logs" ON public.error_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete error logs" ON public.error_logs
  FOR DELETE USING (public.is_admin(auth.uid()));
