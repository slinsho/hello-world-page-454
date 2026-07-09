
CREATE OR REPLACE FUNCTION public.list_properties_shuffled(
  _seed text,
  _county text DEFAULT NULL,
  _property_type text DEFAULT NULL,
  _listing_type text DEFAULT NULL,
  _min_price numeric DEFAULT NULL,
  _max_price numeric DEFAULT NULL,
  _search text DEFAULT NULL,
  _owner_id uuid DEFAULT NULL,
  _only_promoted boolean DEFAULT false,
  _sort text DEFAULT 'random',
  _from int DEFAULT 0,
  _to int DEFAULT 14
)
RETURNS SETOF public.properties
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.properties p
  WHERE p.status = 'active'
    AND (_county IS NULL OR p.county = _county)
    AND (_property_type IS NULL OR p.property_type::text = _property_type)
    AND (_listing_type IS NULL OR p.listing_type::text = _listing_type)
    AND (_min_price IS NULL OR p.price_usd >= _min_price)
    AND (_max_price IS NULL OR p.price_usd <= _max_price)
    AND (_owner_id IS NULL OR p.owner_id = _owner_id)
    AND (_only_promoted = false OR p.is_promoted = true)
    AND (
      _search IS NULL OR _search = '' OR
      p.search_vector @@ plainto_tsquery('english', _search)
    )
  ORDER BY
    p.is_promoted DESC,
    CASE WHEN _sort = 'newest' THEN p.created_at END DESC NULLS LAST,
    CASE WHEN _sort = 'price_low' THEN p.price_usd END ASC NULLS LAST,
    CASE WHEN _sort = 'price_high' THEN p.price_usd END DESC NULLS LAST,
    CASE WHEN _sort = 'random' THEN md5(p.id::text || COALESCE(_seed,'')) END ASC
  OFFSET GREATEST(_from, 0)
  LIMIT GREATEST((_to - _from) + 1, 1);
$$;

GRANT EXECUTE ON FUNCTION public.list_properties_shuffled(text,text,text,text,numeric,numeric,text,uuid,boolean,text,int,int) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.count_properties_filtered(
  _county text DEFAULT NULL,
  _property_type text DEFAULT NULL,
  _listing_type text DEFAULT NULL,
  _min_price numeric DEFAULT NULL,
  _max_price numeric DEFAULT NULL,
  _search text DEFAULT NULL,
  _owner_id uuid DEFAULT NULL,
  _only_promoted boolean DEFAULT false
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.properties p
  WHERE p.status = 'active'
    AND (_county IS NULL OR p.county = _county)
    AND (_property_type IS NULL OR p.property_type::text = _property_type)
    AND (_listing_type IS NULL OR p.listing_type::text = _listing_type)
    AND (_min_price IS NULL OR p.price_usd >= _min_price)
    AND (_max_price IS NULL OR p.price_usd <= _max_price)
    AND (_owner_id IS NULL OR p.owner_id = _owner_id)
    AND (_only_promoted = false OR p.is_promoted = true)
    AND (
      _search IS NULL OR _search = '' OR
      p.search_vector @@ plainto_tsquery('english', _search)
    );
$$;

GRANT EXECUTE ON FUNCTION public.count_properties_filtered(text,text,text,numeric,numeric,text,uuid,boolean) TO anon, authenticated;
