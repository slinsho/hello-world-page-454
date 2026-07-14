This is a large, multi-module feature set. Below is the plan I'll follow. I've bundled related work so you can approve the whole scope at once.

## 1. New account types on Sign Up
Extend the existing `user_role` enum with two new roles:
- **hotel** — must complete a Hotel Verification flow (business docs, owner ID, agency-style details). Cannot upload anything until admin approves. Once approved, gets a dedicated **Hotel Dashboard** (NOT the property homepage).
- **customer** — a lightweight buyer/guest account. No "Upload Property" button, no owner statistics dashboard, no promotions. Only sees: browse properties, favorites, book hotels, property inquiries, offers, inspections, messages.

Sign-up page gets a 4-option role picker: Owner · Agent · Hotel · Customer.

## 2. Hotel module (mirrors uploaded designs)

New tables:
- `hotels` — name, description, county/district/city, address, cover photo, gallery (up to 18), amenities (jsonb: wifi, pool, breakfast, parking, ac, gym, restaurant, airport_shuttle, front_desk_24_7, laundry, +custom), star_rating, is_verified, owner_id, status.
- `hotel_rooms` — hotel_id, name (Standard/Deluxe/Executive/Suite/custom), price_per_night, guests, size_sqm, bed_type, amenities, photos, is_most_popular.
- `hotel_bookings` — hotel_id, room_id, guest_id, check_in, check_out, guests, rooms, subtotal, taxes, service_fee, total, payment_method (pay_online/pay_at_hotel/mobile_money/bank_transfer), payment_reference, status (pending/confirmed/cancelled/completed).

All with GRANTs + RLS: hotel owners manage their own; customers manage their own bookings; admins see everything.

### Hotel Owner Dashboard (`/hotel-dashboard`)
Replaces the normal property home for role='hotel'. Tabs:
- **Overview** — bookings today, revenue, occupancy.
- **My Hotels** — create/edit hotel (name, location, description, cover + gallery, amenities picker, star rating).
- **Rooms** — per-hotel room manager (name, price, guests, size, bed, amenities, photos, "Most Popular" flag).
- **Bookings** — list of guest bookings with confirm/cancel actions.
- **Verification** — status card.

### Public Hotel Browsing (from small "Book Hotel" card on homepage)
- **Small rectangle card** center-right of homepage titled **"Book Hotel"** → `/hotels`.
- `/hotels` — Hotel homepage: search + filter (county, price, amenities), verified hotels grid, matches the design's card style.
- `/hotels/:id` — Hotel detail page (image gallery with `1/18` counter, verified badge, rating, amenities strip, About, Great Deal banner, Call Hotel + Check Availability buttons, Top Amenities). Matches uploaded image 3.
- `/hotels/:id/rooms` — Choose Your Room (date pickers, guests, room cards with Most Popular badge, sticky bottom "Continue to Book"). Matches image 2.
- `/hotels/:id/book` — Booking Summary + Payment Method picker + Confirm Booking. Matches image 1.

## 3. "Want to Buy" module
- **Small rectangle card** center-left of homepage titled **"Want to Buy"** → `/want-to-buy`.
- `/want-to-buy` — dedicated page listing ONLY properties where `listing_type = 'for_sale'`. Uses existing `PropertyList` with `listing_type='for_sale'` filter.

## 4. Property Inspection module
New table `property_inspections`:
- property_id, requester_id, inspection_type ('location_availability' | 'documents_legitimacy' | 'help_me_buy'), fee_usd, status ('pending'/'in_review'/'completed'/'rejected'), form_data (jsonb — different fields per type), admin_notes, created_at.

On `PropertyDetail` for `for_sale` properties, add an **"Inspect this property"** button. Opens a page `/inspect/:propertyId`:

Step 1 — pick type card:
- **Location & Availability** — $10 flat
- **Documents & Legitimacy** — $80 flat
- **Help Me Buy** — 0.4% of property price (auto-calculated)

Step 2 — dynamic form per type:
- Location: preferred inspection date, contact phone, notes.
- Documents: buyer's full name, ID type + number, lawyer preference, notes.
- Help Me Buy: budget confirmation, financing method, target close date, phone, notes.

Step 3 — payment reference (manual "Name - Reference" like existing verification/promotion flow) → submits to admin.

## 5. Admin Portal additions
New tabs under Admin Navigation:
- **Hotels** — approve/reject hotel accounts, view all hotels & rooms, moderate.
- **Hotel Bookings** — all bookings across the platform.
- **Inspections** — review inspection requests, mark completed, add admin notes.
- Extend **Verifications** tab to handle the new `hotel` verification type.

## 6. Sign Up & role-based routing
- Update `Auth.tsx` role picker.
- After signup:
  - `hotel` → redirected to `/verification?type=hotel`; blocked from `/hotel-dashboard/upload` until approved.
  - `customer` → redirected to home; nav hides "Upload", "Promotions", owner stats.
- Update `Navbar` / bottom nav to be role-aware:
  - customer: Home, Search, Book Hotel, Favorites, Profile.
  - hotel: Hotel Dashboard, Bookings, Messages, Profile.
  - owner/agent: unchanged.

## Technical notes
- All new tables get GRANTs + RLS + `has_role`/owner-scoped policies.
- Uses existing `has_role`, `is_admin`, `notifyAdmins`, `verification_requests` patterns.
- Hotel and inspection payments follow the existing manual "Name - Reference" flow (no Stripe — per project memory).
- Star hotel design uses your existing red-primary / navy light theme.
- Reuses `PropertyList` filters where possible.

## Rough delivery order
1. Migration: enum values, tables, GRANTs, RLS, indexes.
2. Auth signup update + role-based routing guards.
3. Hotel public pages (3 screens matching your mockups).
4. Hotel owner dashboard.
5. Want-to-Buy page + homepage cards.
6. Inspection flow + PropertyDetail button.
7. Admin tabs for Hotels, Bookings, Inspections.
8. Nav/dashboard visibility rules for customer role.

Reply **approve** to proceed, or tell me what to adjust (e.g. drop a module, change inspection prices, different customer permissions).