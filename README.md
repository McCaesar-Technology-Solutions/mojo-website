# MOJO Stays

Recreate the website "MOJO Apartments | Premium Property & Hotel Booking" with high visual fidelity using Tailwind CSS and the Solar icon set via Iconify. The result must be a single-page, ultra-polished landing page that functions as both a marketing homepage and a product deep-dive simulation.

Preserve source quirks:

The navigation uses a custom glassmorphism effect (bg-white/80 backdrop-blur-md) with a specific transition on scroll.

Search inputs in the hero use cursor-text and custom hover states for the entire group container.

The product gallery uses a specific asymmetric grid (4 columns, 2 rows) where the first image spans 2 columns and 2 rows.

Pricing displays utilize specific underline-offset-4 decoration and line-through styles for discounts.

CRITICAL FIDELITY CONSTRAINTS

Background colors must follow the brand palette: bg-brand-50 (#FAFAFA) and text-brand-900 (#24104D).

Primary accent: Luxury Gold #C89B2C. Primary dark: Deep Royal Purple #2D1659. Secondary background: Light Lavender #F3F0FA.

Typography must use 'Inter' from Google Fonts with weights 300, 400, 500, and 600.

Imagery must use exact Unsplash URLs provided in the ASSET MAP.

No generic icons: use only iconify-icon with the specified solar:* tags.

TECH STACK / DEPENDENCIES

Framework: Tailwind CSS (Play CDN: https://cdn.tailwindcss.com)

Icons: Iconify (https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js)

Fonts: Inter via Google Fonts

Script: Native JS for scroll-triggered navbar opacity changes.

ASSET MAP

Hero Background: https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80

Property 1 (Accra): https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

Property 2 (Kumasi): https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

Property 3 (Takoradi): https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

Property 4 (Tema): https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

Hotel 1 (Luxury Suite): https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

Hotel 2 (Executive Room): https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg

Hotel 3 (Serviced Apartment): https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

Hotel 4 (Corporate Suite): https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

Gallery Main: https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80

Gallery Thumb 1: https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg

Gallery Thumb 2: https://images.unsplash.com/photo-1515859005217-8a1f08870f59?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80

Gallery Thumb 3: https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80

Gallery Thumb 4: https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80

User Avatars: [https://images.unsplash.com/photo-1438761681033-6461ffad8d80, https://images.unsplash.com/photo-1472099645785-5658abf4ff4e, https://images.unsplash.com/photo-1534528741775-53994a69daeb]

LAYER STACK / POSITIONING MAP

Navigation: fixed, z-50, top-0, h-16, bg-white/80 with backdrop-blur.

Hero: relative, h-[85vh]. Layer 0: bg-fixed image; Layer 10: bg-black/20 overlay; Layer 20: Text & Search widget.

Search Widget: max-w-4xl, bg-white, rounded-2xl, absolute/relative positioning within hero z-index 20.

Sticky Sidebar: sticky, top-24, z-10 relative to the content grid in the deep-dive section.

SECTION 1 – Navigation

Logo: "MOJO" in uppercase, tracking-tighter, rendered in Luxury Gold #C89B2C.

Desktop Links: "Accommodation" and "Properties" with icon:solar:alt-arrow-down-linear. Include hover-triggered dropdowns with opacity-0 invisible to opacity-100 visible transition.

Right Actions: Magnifier, separator bar, Sign In text, Book Now button (Deep Royal Purple #2D1659 bg), Cart icon with gold numeric badge "2".

SECTION 2 – Hero

Title: "Your Perfect Stay Begins with MOJO Apartments."

Subtext: "Discover premium apartments and hotels thoughtfully managed across Ghana."

Search Bar: Row of 3 interactive inputs (Location, Dates, Guests) + Search Button in #2D1659. Each input has a group-hover background shift to bg-gray-100.

SECTION 3 – Featured Properties

Grid: 4 columns.

Cards: Image container with overflow-hidden. Hover state: scale-105 on image, heart icon appears, "View Details" text appears with gold #C89B2C underline.

Badges: "Apartment" / "Hotel" in white/90 backdrop-blur capsules.

SECTION 4 – Curated Hotel Stays

Background: #F3F0FA border-y.

Cards: Vertical flex with white background, rounded-2xl. Include discount badge (e.g., "-20% This Week") in Deep Royal Purple #2D1659.

SECTION 5 – Product Deep Dive (MOJO Luxury Suite – Cantonments, Accra)

Breadcrumbs: Home > Accommodation > MOJO Luxury Suite.

Gallery Grid: grid-cols-1 md:grid-cols-4 grid-rows-2. Main image md:col-span-2 md:row-span-2. Last image has bg-black/20 overlay with "View all 24 photos" text.

Content: 2/3 column for amenities/policies/house rules; 1/3 column for sticky booking enquiry card.

Timeline: Left-border line with solid gold #C89B2C dot for highlighted amenity and empty circles for subsequent items.

Sticky Card: Check-in/out grid, guest count select, price breakdown in GHS, and "Book Enquiry" button in #2D1659.

SECTION 6 – Testimonials

3-column grid. Star icons: solar:star-bold in gold #C89B2C. Card style: bg-white, shadow-sm, rounded-2xl.

SECTION 7 – Footer

Pre-footer: Centered "Ready to experience MOJO?" with account buttons and grayscale payment icons (Visa, Mastercard, Amex).

Main Footer: 4-column layout (Brand info, Accommodation, Support, Company).

Sub-footer: Copyright left, WhatsApp / Currency toggle right.

GLOBAL ANIMATION / INTERACTION RULES

Navbar: window.addEventListener('scroll', ...) toggles shadow-sm and bg-white/90 when scrollY > 20.

Hover scales: All main card images must scale-105 over 700ms on parent hover.

Buttons: active:scale-[0.98] on the primary "Book Enquiry" button.

Smooth Scroll: Enabled on html tag.

IMPLEMENTATION REQUIREMENTS

Do not use placeholders. Use original Unsplash URLs.

Use explicit Tailwind classes for all responsive behaviors (hidden/block, col-span changes).

Ensure the layer order matches the source precisely for the fixed nav and sticky sidebar.

All pricing in Ghana Cedis (GHS). All locations in Ghana.

## Production stack

MOJO is a TanStack Start app with **Supabase** (Auth, Postgres + RLS, Storage, Edge Functions) and **Paystack** Instant Book.

- Public routes: `/`, `/properties`, `/properties/$slug`, auth, account, legal pages
- Admin: `/admin/*` (content, enquiries, bookings, calendar, guests, analytics, reviews, audit)
- Booking: Request to Book (enquiry → admin approve) and Instant Book (Paystack)
- Without env vars the UI runs in **demo mode** using `src/data/demo-properties.ts`

Setup guides: [docs/PRODUCTION.md](docs/PRODUCTION.md), [docs/RUNBOOKS.md](docs/RUNBOOKS.md), [docs/RLS_CHECKLIST.md](docs/RLS_CHECKLIST.md).  
Copy [.env.example](.env.example) → `.env.local`, apply `supabase/migrations/`, then seed.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e414ad83-7fdb-46a6-a4bb-4ed070552594).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

```sh
npm i
cp .env.example .env.local   # add Supabase keys when ready
npm run dev
npm run typecheck
npm run build
```

