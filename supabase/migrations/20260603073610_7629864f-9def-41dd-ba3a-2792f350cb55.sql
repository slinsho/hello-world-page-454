-- Revoke column-level SELECT on PII fields from anon/authenticated so owners cannot read ip/user_agent
REVOKE SELECT ON public.property_views FROM anon, authenticated;

-- Re-grant SELECT only on non-PII columns
GRANT SELECT (id, property_id, viewer_id, viewed_at) ON public.property_views TO anon, authenticated;

-- Keep INSERT capability for view tracking
GRANT INSERT ON public.property_views TO anon, authenticated;

-- service_role retains full access
GRANT ALL ON public.property_views TO service_role;