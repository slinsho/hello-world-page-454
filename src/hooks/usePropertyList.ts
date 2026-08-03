import { useCallback, useEffect, useMemo } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSessionSeed } from "@/lib/sessionSeed";

export type PropertySort = "random" | "newest" | "price_low" | "price_high";

export interface PropertyListFilters {
  county?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  ownerId?: string;
  onlyPromoted?: boolean;
}

export interface UsePropertyListOptions {
  filters?: PropertyListFilters;
  sort?: PropertySort;
  pageSize?: number;
  /** Set false to disable auto prefetching the next page. */
  prefetch?: boolean;
  /** Optional key namespace so different pages don't collide. */
  scope?: string;
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 15;

function filterKey(f: PropertyListFilters | undefined) {
  return {
    c: f?.county ?? null,
    pt: f?.propertyType ?? null,
    lt: f?.listingType ?? null,
    min: f?.minPrice ?? null,
    max: f?.maxPrice ?? null,
    q: (f?.search ?? "").trim() || null,
    o: f?.ownerId ?? null,
    p: !!f?.onlyPromoted,
  };
}

async function fetchPage(params: {
  seed: string;
  filters: PropertyListFilters;
  sort: PropertySort;
  from: number;
  to: number;
}) {
  const { seed, filters, sort, from, to } = params;
  const { data, error } = await supabase.rpc("list_properties_shuffled", {
    _seed: seed,
    _county: filters.county ?? null,
    _property_type: filters.propertyType ?? null,
    _listing_type: filters.listingType ?? null,
    _min_price: filters.minPrice ?? null,
    _max_price: filters.maxPrice ?? null,
    _search: filters.search?.trim() || null,
    _owner_id: filters.ownerId ?? null,
    _only_promoted: filters.onlyPromoted ?? false,
    _sort: sort,
    _from: from,
    _to: to,
  });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [] as any[];

  // Batch: profiles for owners on this page (single request per page).
  const ownerIds = Array.from(
    new Set(rows.map((r) => r.owner_id).filter(Boolean))
  );
  let profilesMap = new Map<string, any>();
  if (ownerIds.length) {
    const { data: profs } = await supabase
      .from("profiles_public" as any)
      .select("id, name, role, verification_status, profile_photo_url")
      .in("id", ownerIds);
    profilesMap = new Map((profs || []).map((p: any) => [p.id, p]));
  }
  return rows.map((r) => ({
    ...r,
    profiles: profilesMap.get(r.owner_id) || null,
  }));
}

async function fetchCount(filters: PropertyListFilters) {
  const { data, error } = await supabase.rpc("count_properties_filtered", {
    _county: filters.county ?? null,
    _property_type: filters.propertyType ?? null,
    _listing_type: filters.listingType ?? null,
    _min_price: filters.minPrice ?? null,
    _max_price: filters.maxPrice ?? null,
    _search: filters.search?.trim() || null,
    _owner_id: filters.ownerId ?? null,
    _only_promoted: filters.onlyPromoted ?? false,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export function usePropertyList(options: UsePropertyListOptions = {}) {
  const {
    filters = {},
    sort = "random",
    pageSize = DEFAULT_PAGE_SIZE,
    prefetch = true,
    scope = "list",
    enabled = true,
  } = options;

  const seed = useMemo(() => getSessionSeed(), []);
  const fKey = useMemo(() => filterKey(filters), [
    filters.county,
    filters.propertyType,
    filters.listingType,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
    filters.ownerId,
    filters.onlyPromoted,
  ]);
  const queryKey = useMemo(
    () => ["property-list", scope, sort, pageSize, fKey, seed] as const,
    [scope, sort, pageSize, fKey, seed]
  );

  const queryClient = useQueryClient();

  const list = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchPage({
        seed,
        filters,
        sort,
        from: (pageParam as number) * pageSize,
        to: (pageParam as number) * pageSize + pageSize - 1,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < pageSize) return undefined;
      return allPages.length; // next page index
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const count = useQuery({
    queryKey: ["property-count", scope, fKey],
    queryFn: () => fetchCount(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Background prefetch of the following page once current one arrives.
  useEffect(() => {
    if (!prefetch || !list.data) return;
    if (list.isFetchingNextPage) return;
    if (!list.hasNextPage) return;
    const nextPage = list.data.pages.length;
    queryClient.prefetchInfiniteQuery({
      queryKey,
      initialPageParam: nextPage,
      queryFn: ({ pageParam }) =>
        fetchPage({
          seed,
          filters,
          sort,
          from: (pageParam as number) * pageSize,
          to: (pageParam as number) * pageSize + pageSize - 1,
        }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.data?.pages.length, list.hasNextPage, list.isFetchingNextPage]);

  const items = useMemo(
    () => (list.data?.pages ?? []).flat(),
    [list.data]
  );

  const loadMore = useCallback(() => {
    if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
  }, [list]);

  const retry = useCallback(() => {
    list.refetch();
  }, [list]);

  return {
    items,
    total: count.data,
    isLoading: list.isLoading,
    isError: list.isError || count.isError,
    error: list.error || count.error,
    hasMore: !!list.hasNextPage,
    isFetchingNext: list.isFetchingNextPage,
    loadMore,
    retry,
  };
}
