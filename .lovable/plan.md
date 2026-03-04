

## App-Wide Audit and Professional Desktop Redesign

### Problem Assessment
The entire app is built with a mobile-first approach using narrow `max-w-2xl` / `max-w-md` / `max-w-lg` containers. On desktop, this results in a thin column centered on a wide screen -- it looks like a phone app running on a monitor. Key issues:

1. **Desktop looks like mobile** -- pages use single-column narrow layouts (`max-w-2xl`, `max-w-md`) with no desktop-specific grid expansion
2. **Profile page lacks polish** -- basic card layout, no desktop sidebar pattern, stats and properties crammed in a single column
3. **Homepage has no desktop hero/sidebar** -- just a vertical scroll of cards
4. **Dashboard is mobile-only layout** -- single column stats, no desktop grid
5. **Property Detail is narrow** -- no side-by-side layout for gallery + info on desktop
6. **Navbar doesn't leverage desktop space** -- top bar is minimal, no expanded desktop nav with search inline

### Plan

#### 1. Homepage (Index.tsx) -- Desktop Layout
- On desktop (`md:` and above), use a wider container and multi-column property grid (already has `lg:grid-cols-3`)
- Add a desktop header section above properties with a hero/welcome area
- Expand the top navbar on desktop: inline search bar, horizontal nav links, notification icons spread across a proper header bar

#### 2. Navbar (Navbar.tsx) -- Desktop Navigation
- Desktop: Full-width top bar with logo left, inline search center, nav links + icons right
- Keep mobile bottom tab bar unchanged
- Add desktop-only expanded filter bar on homepage

#### 3. Profile Page (Profile.tsx) -- Professional Desktop Layout
- **Desktop**: Two-column layout -- left sidebar (avatar, name, contact info, verification, social links, action buttons) + right main area (stats row, properties grid, reviews)
- **Mobile**: Keep current single-column card layout
- Widen the container on desktop to `max-w-5xl`
- Use a proper sidebar card with fixed position feel
- Properties should display in a 2-col grid on desktop instead of single column list
- Add a proper header banner that spans full width on desktop

#### 4. Property Detail (PropertyDetail.tsx) -- Desktop Split Layout
- **Desktop**: Two-column layout -- left (image gallery, description) + right sticky sidebar (price, owner info, contact actions)
- **Mobile**: Keep current stacked layout
- Fix the bottom action bar to only show on mobile; on desktop, contact actions are in the sidebar

#### 5. Dashboard (OwnerDashboard.tsx) -- Desktop Grid
- Expand to `max-w-5xl` on desktop
- Stats cards in a 4-col row on desktop (already 2-col on mobile)
- Views chart and properties list side by side on desktop
- Inquiries section full width below

#### 6. Upload Page (Upload.tsx) -- Desktop Two-Column Form
- On desktop, split the form into two columns (details left, media right)
- Wider container on desktop

#### 7. Explore Page (Explore.tsx) -- Desktop Sidebar Filters
- On desktop, show filters as a persistent left sidebar instead of bottom sheet
- Property grid takes remaining width

#### 8. Verification Page -- Already styled mobile-app, add desktop width expansion
- Center the form with a max-width but add a decorative sidebar or illustration on desktop

### Technical Approach
- Use responsive Tailwind breakpoints (`md:`, `lg:`, `xl:`) throughout
- No new dependencies needed
- Pattern: wrap page content in responsive containers, use `md:grid md:grid-cols-[sidebar_main]` for two-column layouts
- Key breakpoint: `md:` (768px) switches from mobile to desktop

### Files to Modify
1. `src/components/Navbar.tsx` -- Desktop expanded nav
2. `src/pages/Index.tsx` -- Desktop hero, wider layout
3. `src/pages/Profile.tsx` -- Two-column desktop layout
4. `src/pages/PropertyDetail.tsx` -- Split desktop layout with sticky sidebar
5. `src/pages/OwnerDashboard.tsx` -- Wider desktop grid
6. `src/pages/Upload.tsx` -- Two-column desktop form
7. `src/pages/Explore.tsx` -- Desktop sidebar filters
8. `src/pages/Verification.tsx` -- Desktop width adjustment
9. `src/pages/Messages.tsx` -- Desktop expansion
10. `src/pages/Notifications.tsx` -- Desktop expansion

