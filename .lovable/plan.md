# Hotel Account Redesign

## Why Account currently "changes" the bottom nav
The global `Navbar` renders its own mobile bottom nav on every page. `HotelDashboard` layered a second, hotel-specific bottom nav on top of it. When you tapped **Account**, it navigated to `/profile`, which does not layer the hotel nav — so only the global one (Home / Explore / Hotel / …) showed. That's why it looked like the app took you back to the homepage nav.

Fix: create a shared `HotelShellLayout` that
- hides the global mobile bottom nav on hotel routes (via a route flag or `HotelShellGuard`),
- renders the hotel bottom nav on **every** hotel page,
- routes Account to a real hotel account page instead of `/profile`.

## New routes (each a dedicated page, all wrapped in `HotelShellLayout`)
- `/hotel-dashboard` — redesigned overview (matches screenshot)
- `/hotel-dashboard/hotels` — My Hotels list + Add Hotel
- `/hotel-dashboard/rooms` — Rooms list + Add Room (per selected hotel)
- `/hotel-dashboard/bookings` — Bookings management
- `/hotel-dashboard/account` — Hotel account (profile, plan, verification, sign out)

Hotel bottom nav items: **Dashboard, Hotels, Rooms, Bookings, Account** — always visible, active state driven by the current route.

## Redesigned Dashboard (matches screenshot)

Sections top → bottom:
1. **Header** — hamburger, "Welcome back, {Hotel Name} 👋", subtitle "Here's what's happening today.", bell w/ badge, avatar.
2. **Hotel identity card** — cover photo (left), hotel name + Verified pill, rating + reviews, location w/ pin, meta grid (Hotel ID, Member since, Plan), "View Profile ›" button.
3. **Stat grid (2 rows × 3 cols)** — colored icon tiles:
   - Hotels (blue), Rooms (purple), Total Bookings (green)
   - Pending (orange), Confirmed (teal, with ↑% vs last month), Revenue This Month (teal, with ↑% vs last month)
4. **Quick Actions** — 4 tiles: Add Hotel, Add Room, View Bookings, Payments (colored circle icon + label + sublabel), "View All ›" on the right.
5. **Booking Overview** — card with title + "This Week" dropdown, simple bar chart (Mon–Sun) with side stats (Total Bookings + Δ, Avg Daily + Δ). Chart via existing `recharts`.
6. **Guest Reviews** — card, empty state illustration + copy + big rating tile (0.0 / No reviews yet), "View All ›".

Design tokens: use existing semantic tokens; add soft tinted backgrounds for icon tiles (`bg-primary/10`, `bg-purple-500/10`, `bg-emerald-500/10`, `bg-orange-500/10`, `bg-cyan-500/10`) — no hardcoded hex.

## Technical notes
- New files: `src/components/HotelShellLayout.tsx`, `src/pages/HotelHotels.tsx`, `src/pages/HotelRoomsAdmin.tsx` (rename to avoid clash with existing public `HotelRooms.tsx`), `src/pages/HotelBookings.tsx`, `src/pages/HotelAccount.tsx`.
- Extract Add Hotel / Add Room dialog forms out of `HotelDashboard.tsx` into small reusable components used by the new pages.
- Update `Navbar.tsx` to hide the mobile bottom nav when `location.pathname.startsWith("/hotel-dashboard")`.
- Add routes in `App.tsx`.
- Bar chart via `recharts` (already in stack).

Only frontend/presentation changes — no schema or business logic changes.
