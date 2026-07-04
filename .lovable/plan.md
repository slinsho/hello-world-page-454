# Plan: Features 4, 5, and 9

Three focused features. Each ships independently but shares the same profile/verification foundation already in the app.

---

## Feature 4 — Agent Leaderboard & Public Agent Profiles

**Goal:** Rank verified agents by activity/trust, and give each agent a shareable public page.

**Pages / components**
- `src/pages/Agents.tsx` — already exists as a list; upgrade to a ranked leaderboard with:
  - Top 3 podium cards (avatar/logo, agency name, score, badges)
  - Ranked table below: rank, agent, verified listings count, avg review rating, response time, total views
  - County + sort filters (top rated / most listings / most viewed)
- `src/pages/AgentProfile.tsx` (new) at route `/agent/:id` — public profile:
  - Header: agency logo, name, verified badge, county, join date, social links
  - Stats strip: listings, avg rating, reviews count, response rate
  - Tabs: Active Listings, Reviews, About
  - CTA: WhatsApp + in-app message

**Data**
- New DB view `public.agent_leaderboard` (SECURITY INVOKER) aggregating:
  - active listing count from `properties`
  - avg rating + count from `reviews`
  - total views from `property_views`
  - only users with `verification_type='agent'` and status `approved`
- Add `GRANT SELECT` to `anon, authenticated`.

**Routing**
- Add `/agent/:id` route in `App.tsx`.

---

## Feature 5 — Neighborhood Insights

**Goal:** Static, curated county-level context surfaced on property detail and a small standalone card.

**Approach (no external API)**
- New table `public.county_insights` seeded by admin:
  - `county` (unique), `overview`, `population`, `schools_count`, `hospitals_count`, `markets_count`, `highlights` (text[]), `image_url`
- Public read; admin-only write (uses existing `is_admin`).
- Admin editor: new tab in `AdminNavigation` → `AdminCountyInsights.tsx` (list + edit form).
- Consumer components:
  - `NeighborhoodInsights.tsx` — used on `PropertyDetail` under the description, shows county overview + highlight chips.
  - Card variant on `NearMe` page header.

**Seed**
- Insert baseline rows for the 15 Liberian counties with empty placeholders so admin can fill later.

---

## Feature 9 — Verified Buyer/Tenant Badge

**Goal:** Light KYC signal so owners/agents know an inquiry is from a real person.

**Approach**
- Reuse existing `verification_requests` table by adding a new `verification_type` value `buyer` (already an open text column — confirm and extend as needed).
- Buyer verification is **free** (no payment step), requires:
  - Live camera selfie (existing selfie capture flow)
  - Government ID number (text)
  - Phone number confirmed
- Admin reviews in existing `AdminVerifications` list; approval sets a flag readable from `profiles`.
- New computed on `profiles`: nothing schema-wise needed — we already join verification. Add a helper `useBuyerVerification(userId)` and a `<VerifiedBuyerBadge />` component.
- Surface the badge:
  - Next to sender name in `PropertyInquiryForm` submissions / `DashboardInquiries`
  - On `MakeOfferForm` submissions
  - In `Messages` thread header
- Entry point: new "Get Verified as Buyer" card in `Settings` for users whose role is `user` (not owner/agent).

**No payment**, so it avoids the promotion/payment workflow entirely.

---

## Technical notes

- All new tables follow the required CREATE → GRANT → RLS → POLICY order.
- Leaderboard is a **view**, not a table — always fresh, no cron.
- `AgentProfile` reuses `PropertyCard` for the listings tab.
- Buyer verification piggybacks on existing selfie capture + admin review UI to keep scope tight.
- No new external APIs; no Google Maps required for neighborhood insights.

## Order of implementation

1. Migration: `county_insights` table + seed + `agent_leaderboard` view + buyer verification type support.
2. Feature 9 (smallest surface): badge component + Settings entry + admin approval hook-in.
3. Feature 5: admin editor + display components on PropertyDetail and NearMe.
4. Feature 4: rebuild Agents page as leaderboard + new AgentProfile route.

Approve and I'll start with the migration.
