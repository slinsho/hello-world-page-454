
-- Add impression counter for round-robin scheduling
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS promotion_impression_count integer NOT NULL DEFAULT 0;

-- Function to get promoted properties using round-robin (least impressions first)
-- and atomically increment their impression counts
CREATE OR REPLACE FUNCTION public.get_round_robin_promoted(limit_count integer DEFAULT 10)
RETURNS SETOF properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_ids uuid[];
BEGIN
  -- Select the least-shown promoted properties
  SELECT array_agg(id) INTO selected_ids
  FROM (
    SELECT id 
    FROM properties 
    WHERE is_promoted = true AND status = 'active'
    ORDER BY promotion_impression_count ASC, updated_at DESC
    LIMIT limit_count
  ) sub;

  -- Increment their impression counts
  IF selected_ids IS NOT NULL THEN
    UPDATE properties 
    SET promotion_impression_count = promotion_impression_count + 1
    WHERE id = ANY(selected_ids);
  END IF;

  -- Return the selected properties
  RETURN QUERY 
    SELECT * FROM properties 
    WHERE id = ANY(COALESCE(selected_ids, ARRAY[]::uuid[]))
    ORDER BY promotion_impression_count ASC;
END;
$$;
