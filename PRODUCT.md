# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Guests (primary public audience):** People booking premium stays in Ghana. Mix of travelers, with a lean toward **business travelers** (trips that need reliable confirmation and clear next steps). Also Accra weekenders, diaspora visits, and families — but homepage and booking copy should speak first to the business traveler’s need for trust and certainty.

**Ops (primary `/admin` audience):** MOJO ops / property managers — a small team. Day-to-day operators of the Request-to-Book pipeline across Ghana stays. Not guests.

## Product Purpose

MOJO Apartments lets guests discover **specific, thoughtfully managed** apartments and hotels in Ghana and submit booking requests. The team confirms availability and follows up to finalize the stay. `/admin` is the internal ops console for that pipeline (enquiries, inventory, calendar, bookings).

**Guest success:** Find a trusted stay quickly, submit a clear request, know what happens next (confirmation / WhatsApp follow-up), without expecting Instant Book payment at launch.

**Ops success:** Enquiries processed accurately and quickly; inventory current; calendar conflicts avoided.

## Positioning

Premium Ghana stays under the MOJO Apartments brand — **trusted, curated inventory for specific managed properties**, not an “all stays in one” marketplace like Booking/Airbnb aggregates. Guests deal with MOJO’s managed selection and a human confirmation path, not an anonymous mega-catalog.

`/admin` is an ops console for Request-to-Book workflows — not a SaaS marketing shell and not guest-facing.

## Operating Context

**Guest path:** Browse → property detail → Request to Book enquiry → team review (target: confirm within ~24 hours) → WhatsApp / follow-up to finalize. Optional account for trips and wishlist. Cities in play: Accra, Kumasi, Takoradi, Tema (and more over time).

**Ops path:** Primary daily ritual is the enquiries inbox (approve creates a booking and blocks the calendar; decline with reason). Secondary: publish/price properties, calendar, bookings, guests, analytics. Access is role-gated (`profiles.role = 'admin'`); no open “sign up as admin” path.

## Capabilities and Constraints

- Backend: Supabase (Auth, Postgres, Storage, Edge Functions) with RLS on user-facing tables.
- Launch booking path: **Request-to-Book only** (`request`). Instant Book / Paystack deferred — public UI must not sell Instant Book or payment-complete flows as if live.
- Public site has no demo catalog fallback; empty DB shows empty states.
- Guest surfaces: homepage, property browse/detail, enquiry, about/support/legal, auth, account (trips/wishlist/messages).
- Admin surfaces: Dashboard, Properties, Enquiries (priority), Bookings, Calendar, Guests, Analytics, Reviews, Audit.
- Undecided: Instant Book / payments remain out of scope until product enables them.

## Brand Commitments

- Name: MOJO Apartments (also referred to as MOJO Stays in project docs).
- Palette: Deep Royal `#2D1659`, Luxury Gold `#C89B2C`, Brand ink `#24104D`, Lavender `#F3F0FA`, Brand-50 `#FAFAFA`.
- Admin UI: denser tool UI with royal/gold accents; does **not** mirror the public marketing shell.
- **Public redesign constraints (confirmed):**
  - Keep the existing **hero video** as a real visual plane.
  - **Never invent testimonials**, guest quotes, ratings, or occupancy claims — use real evidence only or omit.
  - **WhatsApp** stays a prominent guest contact / follow-up path.
  - **Mobile-first** — primary nav and CTAs must work on phone (no desktop-only primary chrome).
  - Copy and CTAs must say **Request to Book** (or equivalent honest language), not “Book Now” / Instant Book, while launch is request-only.

## Evidence on Hand

- Live public routes under `src/routes/` and admin under `src/routes/admin/`.
- Brand mark assets in `public/` and `src/components/brand/`.
- Hero video assets in `src/assets/`.
- Production rules in `AGENTS.md`; runbooks in `docs/`.
- Do not fabricate testimonials, occupancy benchmarks, revenue claims, or Instant Book capabilities. Prefer real property media and empty states over stock trust theater.

## Product Principles

1. **Trust over marketplace scale** — MOJO is a curated, managed selection; don’t pretend to be every stay in Ghana.
2. **Honest Request-to-Book** — never imply Instant Book or payment until those ship; say what happens after the request.
3. **Business-traveler clarity** — dates, totals, confirmation path, and next steps must be scannable and certain.
4. **Enquiry-first ops** — admin inbox is the daily job; surface urgency without hunting.
5. **Brand without costume** — royal/gold signal MOJO; guest site earns premium through specificity and honesty, not OTA template chrome.
6. **Don’t invent product or proof** — no fake quotes, fake Instant Book, or fabricated social proof.

## Accessibility & Inclusion

No product-specific WCAG target locked yet. Public and admin must keep keyboard reachability for primary actions, readable contrast, and usable mobile navigation. Guest forms need real labels (not placeholder-only).
