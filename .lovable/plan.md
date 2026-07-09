# Reusable Property Listing System

## Goal
One reusable component + hook powers Home, Explore, Near Me, Featured, Explore by County, Search Results, and Agent Listings. 15 per page, server-side pagination, background prefetch, per-session stable random order, URL-synced filters, cached pages, and clean error/loading states.

## Architecture

```text
┌──────────────────────────────────────────────┐
│  usePropertyList(params)  ← TanStack useInfiniteQuery
│    • server-side range() pagination (15)
│    • prefetches next page automatically
│    • cancels stale requests on param change
│    • cache keyed by filter signature
└─────────────┬────────────────────────────────┘
              │
      ┌───────▼────────┐
      │ <PropertyList/>│  Skeletons · Grid · Load More · Error+Retry
      └───────┬────────┘
              │ used by
   Home · Explore · NearMe · Featured · CountyLanding · Agents · SearchResults
```

## New files
- `src/hooks/usePropertyList.ts` — TanStack `useInfiniteQuery` wrapper. Accepts `{ filters, sort, pageSize=15, sessionSeed }`. Uses `supabase.from('properties').select(...).range(from,to)` with a `count: 'exact'` head request only on first page. Fetches profiles/agent info in a single batched query per page. Returns `{ pages, hasMore, loadMore, isFetchingNext, isError, retry, total }`.
- `src/lib/sessionSeed.ts` — generates/reads a per-day session seed from `sessionStorage` (`lprop_shuffle_seed`), rotates every 24h. Used to deterministically shuffle results in "random" sort mode so pagination never repeats or skips.
- `src/components/PropertyList.tsx` — grid + skeleton + Load More + retry. Props: `filters`, `sort`, `variant?`, `emptyState?`, `priorityCount?`.
- `src/hooks/useUrlListState.ts` — reads/writes `page`, `county`, `type`, `listing`, `q`, `sort` via `useSearchParams` (History API, no reload). Debounced writes on filter change.

## Randomization strategy
- Add a stable `shuffle_key` computed as `md5(id || :seed)` client-side after fetching each page? No — that breaks pagination continuity.
- **Correct approach**: server-side `ORDER BY md5(id::text || $seed)` via a new RPC `list_properties_shuffled(seed text, filters jsonb, from int, to int)`. This gives a globally-stable order per seed so `range(0,14)` → `range(15,29)` never overlaps or skips. Falls back to `created_at DESC` when sort ≠ "random".
- Seed lives in sessionStorage + rotates daily → every user gets a different order, same user sees a stable order for the session.

## Migration
- New SQL function `public.list_properties_shuffled(_seed text, _filters jsonb, _from int, _to int)` returning `SETOF properties` with `SECURITY INVOKER` (so RLS still applies). Uses `ORDER BY is_promoted DESC, md5(id::text || _seed)`. Grants `EXECUTE` to `anon`, `authenticated`.

## URL state contract
- Query params: `?page=2&county=Montserrado&type=apartment&listing=for_sale&sort=random&q=beach`.
- On mount: hydrate filter state from URL.
- On filter change: `setSearchParams(next, { replace: false })` → deep-linkable + shareable.
- `page` reflects the highest loaded page so refresh restores same scroll depth.

## Page migrations (one per commit-worthy step)
1. **Explore.tsx** — replace `fetchProperties` + `useState<any[]>` with `<PropertyList filters={filters} sort={sort} />`. Keep sidebar filters, sync to URL.
2. **NearMe.tsx** — pass `{ county }` filter; remove manual profile+agent fetch (moved into hook).
3. **Index.tsx** — first hero card stays hand-rolled; the grid below becomes `<PropertyList pageSize={15} />`.
4. **CountyLanding.tsx** — `<PropertyList filters={{ county }} />`.
5. **FeaturedListings.tsx** — `<PropertyList filters={{ is_promoted: true }} />`.
6. **Agents.tsx** — agent listings tab uses `<PropertyList filters={{ owner_id: agentId }} />`.
7. **Search Results** (part of Explore's `q=` param) — same component.

## Prefetch & UX rules
- After first page renders, `queryClient.prefetchInfiniteQuery` warms page 2 with `staleTime: 5min`.
- Load More reads from cache instantly, then triggers page 3 prefetch.
- Button states: `Load more` (idle) → `Loading…` (disabled) → hidden when `!hasMore`.
- Scroll position preserved by appending (never replacing) DOM nodes.
- On filter/param change: `queryClient.cancelQueries` for the previous key → aborts in-flight requests.

## Error handling
- Hook exposes `isError` + `retry()` that refetches only the failed page.
- Inline error card at bottom of grid with "Retry" — grid content above stays.

## Performance
- `select` narrowed to card-required columns (drops `description`, `virtual_tour_url`, etc.) → smaller payload.
- Batched profile fetch per page (`.in('id', ownerIds)`).
- `React.memo` on `PropertyCard` (already effectively memoized via key).
- `count: 'exact'` requested only once (first page) so we can hide Load More precisely.

## Out of scope (explicit)
- Not converting Reels, Favorites, RecentlyViewed, RecommendedProperties (different data shapes / small fixed lists).
- Not touching admin listing views.
- No infinite-scroll auto-trigger — explicit Load More per spec.

## Rollout order
1. Migration + `list_properties_shuffled` RPC.
2. `sessionSeed.ts`, `usePropertyList.ts`, `PropertyList.tsx`, `useUrlListState.ts`.
3. Explore (highest-traffic, validates approach).
4. Near Me + County Landing + Featured Listings + Agents + Index grid — parallel edits.
5. Manual QA on each page (grid renders, Load More works, URL updates, refresh restores state, random order differs per session).

## Estimated impact
- Network requests on Home / Explore / NearMe drop from a full-table fetch (~all rows) to 15 rows per page.
- Duplicate profile/agent fetches consolidated: 3 queries → 2 per page (properties + profiles+agents).
- Cache hits on Load More = 0 network requests until page N+2 prefetch kicks in.
- Random ordering ensures fair promotion distribution and fresher-feeling home page.
