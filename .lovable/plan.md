# Performance Optimization Plan

UI, branding, layouts, and business rules stay exactly as-is. Every change below is purely under the hood. I'll ship in 4 phases so you can review impact between each — say "go phase 1" (or "do all phases") to start.

---

## Phase 1 — Biggest wins, lowest risk (~70% of perceived speedup)

**1. Image pipeline (the #1 bottleneck on this app)**
- Upgrade `src/lib/imageResize.ts` to: resize to **max 1280px**, output **WebP** at q=78 (with JPEG fallback for old iOS), strip EXIF, hard-cap at 250 KB.
- Reject oversized uploads client-side before they hit Supabase.
- Generate a **400px thumbnail** alongside the full image; store both URLs in the property `photos` array (or sibling thumbnail column — see tech section).
- Add `loading="lazy"`, `decoding="async"`, `fetchpriority` (high for first card / hero, low for off-screen) across `PropertyCard`, `PropertyDetail`, `Reels`, banners.
- Add `width` / `height` attributes to kill CLS.

**2. Route-level code splitting**
- Convert all routes in `src/App.tsx` to `React.lazy` + `<Suspense>` with a lightweight skeleton.
- Heavy admin pages, Reels (video), Analytics, Charts, TipTap editor → lazy-only.

**3. Vendor chunk splitting in `vite.config.ts`**
- Manual chunks: `react`, `supabase`, `radix-ui`, `recharts`, `tiptap`, `embla-carousel`. Cuts initial JS by 40–60%.

**4. Skeleton loaders**
- Replace empty `null` returns during loading on Index, Explore, Profile, Dashboard with the existing `Skeleton` component — eliminates blank flashes.

---

## Phase 2 — Data layer & query efficiency

**5. Eliminate `select('*')`**
Audit every `supabase.from(...).select(...)` and request only the columns the component actually renders. Property cards need ~12 fields, not 35.

**6. React Query everywhere**
- Wrap fetches in `useQuery` with proper `queryKey`s, `staleTime` (60s for listings, 5m for settings, 30m for profile).
- Eliminates duplicate calls when you navigate back to a page.
- Adds free stale-while-revalidate.

**7. DB indexes** (migration)
Add B-tree indexes on `properties`:
- `(status, created_at DESC)` — main listing sort
- `(county)`, `(property_type)`, `(listing_type)`, `(price_usd)`, `(owner_id)`
- Partial: `(is_promoted) WHERE status='active'`

**8. Pagination / infinite scroll on Explore**
`.range()` chunks of 20, `useInfiniteQuery`, IntersectionObserver sentinel.

**9. Defer recommendations & "recently viewed"**
Render only when scrolled near them (IntersectionObserver).

---

## Phase 3 — Rendering & runtime

**10. Memoization where it pays**
- `React.memo(PropertyCard)` with stable props.
- `useMemo` / `useCallback` on filters, sort comparators, formatters in Explore/NearMe.
- Stop creating new object literals inside `.map()` keys.

**11. Virtualize long lists**
Add `@tanstack/react-virtual` to Explore, Favorites, Admin Properties, Admin Users when >50 rows.

**12. Lazy charts**
Wrap Recharts blocks in `<LazyOnVisible>` (IntersectionObserver) — current Admin Analytics loads them all at once.

**13. Animation cleanup**
Audit `index.css` / Tailwind classes: replace any `top/left/width` transitions with `transform`/`opacity`. Add `will-change` only where needed.

---

## Phase 4 — PWA, monitoring, polish

**14. Service worker tuning** (`vite.config.ts` → VitePWA)
- Runtime cache for `*.supabase.co/storage/.../property-photos/**`: `CacheFirst`, 30-day expiry, max 200 entries.
- HTML: `NetworkFirst` (already), 3s timeout.
- Skip caching reels videos (too big, hurts quota).

**15. Lightweight perf logging** (`src/lib/perfMonitor.ts`)
- Log queries >800ms, image loads >2s, route transitions >1s to `console.warn` in prod (sampled 5%).
- Optional: pipe to a `perf_logs` table later — not adding DB writes now to keep bandwidth down.

**16. Compression**
Lovable's hosting already serves Brotli/gzip. I'll just verify build output and add `vite-plugin-compression` for a precompressed `.br` fallback.

**17. Bundle audit**
Run `vite build` analysis, drop unused deps, tree-shake icon imports (`lucide-react` already supports per-icon).

---

## Out of scope (per your rules)
- No UI/visual changes
- No business-logic changes (verification, promotion, offers, roles all untouched)
- No new third-party services

## Risks / things to watch
- Adding the `thumbnail_url` column requires a one-time backfill for existing photos (I'll do it lazily — old listings keep using the full image until re-uploaded).
- WebP-only browsers: targeting Chrome/Edge/Firefox/Safari 14+ — fallback included for older Safari.
- Service-worker image cache means a freshly re-uploaded photo could appear stale for up to 30 days; cache key includes the storage URL hash so new uploads bust automatically.

## Technical details (for reference)

```text
Bundle (estimated):
  before:  ~1.4 MB JS initial
  after :  ~480 KB initial + lazy chunks
Image payload per card:
  before: ~250–800 KB (full-res JPEG)
  after : ~25–60 KB (WebP thumbnail)
LCP on 4G mid-range Android:
  target: <2.5s on Explore, <2.0s on Index
```

Files most affected:
- `src/lib/imageResize.ts` (rewrite)
- `src/App.tsx` (lazy routes)
- `vite.config.ts` (chunks + PWA cache)
- `src/components/PropertyCard.tsx`, `RecommendedProperties.tsx`, `RecentlyViewed.tsx`
- `src/pages/Explore.tsx`, `Index.tsx`, `Profile.tsx`, `OwnerDashboard.tsx`, `Admin*.tsx`
- New: `src/lib/perfMonitor.ts`, `src/components/LazyOnVisible.tsx`
- New migration: indexes on `properties`

---

**Reply with:** `go phase 1`, `do all phases`, or tell me to drop / reorder anything.
