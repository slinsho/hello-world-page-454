# Plan: Ship features 1, 2, 3

## 1. Hotel-specific verification flow
- Extend `verification_requests` to support `verification_type = 'hotel'` (already an enum value or add it).
- New fields captured (stored in existing JSON/columns): business license number, TIN, license photo (live camera), hotel ownership proof photo (live camera), owner selfie.
- Update `src/pages/Verification.tsx` to branch UI when `?type=hotel`: replace ID/agent copy with hotel-specific steps and required captures. Reuse existing live-camera capture (no file uploads per project rule).
- Add a "Get Verified" gate in `HotelShellGuard.tsx` / `HotelDashboard.tsx`: if the hotel-owner profile has no approved hotel verification, show a banner + CTA linking to `/verification?type=hotel`, and keep hotel listings in `pending` until approved.
- Admin: extend `AdminVerifications.tsx` to filter by `hotel` type and render the new fields. Approve/reject actions unchanged.

## 2. Wire hotel Calendar, Pricing rules, Availability into the guest booking flow
Currently `HotelCalendarPage` and `HotelPricingPage` write to `room_availability` and `hotel_pricing_rules`, but the guest checkout (`HotelBooking.tsx`) ignores them.

Changes:
- In `HotelBooking.tsx` room-picker & summary steps:
  - Fetch `room_availability` rows for the selected date range per room.
  - Filter out rooms that have any `is_blocked = true` night in the range.
  - Compute nightly price as: `price_override` (from `room_availability`) → else the highest-priority matching rule in `hotel_pricing_rules` (weekend / seasonal / min-stay) → else `hotel_rooms.price_per_night`.
  - Enforce `min_nights` from pricing rules and show a clear message if violated.
- In `HotelRooms.tsx` / `HotelDetail.tsx` "Choose your room" list, dim + disable rooms unavailable for the chosen dates.
- Add a light server-side re-check on insert into `hotel_bookings` via a `BEFORE INSERT` trigger that rejects overlapping bookings or blocked nights (double-book safety).

## 3. In-app payments for inspections (mobile money reference flow)
Mirror the existing verification/promotion "Name - Reference" pattern.

- Add columns to `property_inspections`: `payment_status` (`unpaid | submitted | confirmed | rejected`, default `unpaid`), `payment_reference text`, `payment_submitted_at timestamptz`.
- New RPC `submit_inspection_payment_reference(p_inspection_id, p_sender_name, p_ref)` — same shape as `submit_verification_payment_reference`, sets status to `submitted`.
- After the customer submits an inspection request in `PropertyInspection.tsx`, show a payment step with the platform mobile-money numbers (from `platform_settings`) and a "Name - Reference" form calling the RPC.
- `AdminInspections.tsx`: show payment status, sender/reference, and Confirm / Reject buttons. Admin work (assign inspector, upload report) unlocks only after `payment_status = 'confirmed'`.
- Notifications: notify customer on confirm/reject; notify admins on submission.

## Technical notes (for reference)
- Migrations needed:
  1. `verification_type` enum: ensure `'hotel'` exists; add optional hotel fields (business_license_no, tin_number, license_photo_url, ownership_proof_url) to `verification_requests`.
  2. `property_inspections`: add payment columns + `submit_inspection_payment_reference` RPC + RLS.
  3. `hotel_bookings`: overlap-guard trigger.
- No new tables; all GRANTs already in place.
- No new secrets required.
- Client work is confined to: `Verification.tsx`, `HotelShellGuard.tsx`, `HotelDashboard.tsx`, `AdminVerifications.tsx`, `HotelBooking.tsx`, `HotelRooms.tsx`, `HotelDetail.tsx`, `PropertyInspection.tsx`, `AdminInspections.tsx`.

Approve and I'll implement in this order: (1) migrations → (2) hotel verification UI → (3) calendar/pricing wiring in booking → (4) inspection payments UI + admin.
