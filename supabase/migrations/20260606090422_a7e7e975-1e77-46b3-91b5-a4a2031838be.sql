CREATE OR REPLACE FUNCTION public.get_property_view_counts(p_property_ids uuid[])
RETURNS TABLE(property_id uuid, view_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pv.property_id, COUNT(*)::bigint AS view_count
  FROM public.property_views pv
  WHERE pv.property_id = ANY(p_property_ids)
  GROUP BY pv.property_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_view_counts(uuid[]) TO anon, authenticated;