# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

MOJO ops / property managers — a small team (not guests). Day-to-day operators of the Request-to-Book pipeline across Ghana stays.

## Product Purpose

MOJO Apartments lets guests discover premium apartments and hotels in Ghana and submit booking requests. `/admin` is the internal ops console where the team reviews those requests, manages inventory, calendar availability, and bookings. Success = enquiries processed accurately and quickly, inventory kept current, calendar conflicts avoided.

## Positioning

Premium Ghana stays under the MOJO Apartments brand. `/admin` is an ops console for Request-to-Book workflows — not a SaaS marketing shell and not guest-facing.

## Operating Context

Primary daily ritual: triage the enquiries inbox (approve creates a booking and blocks the calendar; decline with reason). Secondary: publish/price properties, check calendar availability, review bookings/guests/analytics. Access is role-gated (`profiles.role = 'admin'`); no open “sign up as admin” path.

## Capabilities and Constraints

- Backend: Supabase (Auth, Postgres, Storage, Edge Functions) with RLS on user-facing tables.
- Launch booking path: Request-to-Book only (`request`). Instant Book / Paystack deferred.
- Public site has no demo catalog fallback; empty DB shows empty states.
- Admin surfaces: Dashboard, Properties, Enquiries (priority), Bookings, Calendar, Guests, Analytics, Reviews, Audit.
- Undecided: Instant Book / payments remain out of scope for admin UI until product enables them.

## Brand Commitments

- Name: MOJO Apartments (also referred to as MOJO Stays in project docs).
- Public palette commitments (reuse as ops identity accents, not as a marketing recreation): Deep Royal `#2D1659`, Luxury Gold `#C89B2C`, Brand ink `#24104D`, Lavender `#F3F0FA`, Brand-50 `#FAFAFA`.
- Admin UI direction (confirmed): denser tool UI that stays on-brand via royal/gold accents, but does **not** mirror the public marketing site’s airy card template look.

## Evidence on Hand

- Live admin routes under `src/routes/admin/`.
- Brand mark assets in `public/` and `src/components/brand/`.
- Production rules in `AGENTS.md`; runbooks in `docs/`.
- Do not fabricate testimonials, occupancy benchmarks, or revenue claims beyond real admin stats.

## Product Principles

1. Enquiry-first — the inbox is the daily job; surface urgency and actions without hunting.
2. Ops density — scan many records fast; prefer tables/lists over marketing cards.
3. Brand without costume — royal/gold signal MOJO; layout stays a working console.
4. Trust the pipeline — approve/decline/calendar blocking must feel clear and reversible where product allows.
5. Don’t invent product — no Instant Book or payment UI until those capabilities ship.

## Accessibility & Inclusion

No product-specific WCAG target locked yet; preserve keyboard reachability for primary actions (approve/decline, nav) and readable contrast on dense lists.
