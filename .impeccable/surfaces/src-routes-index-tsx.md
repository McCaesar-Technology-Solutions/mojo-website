---
version: 1
slug: "src-routes-index-tsx"
primary_target: "src/routes/index.tsx"
related_targets: ["src/components/layout/site-nav.tsx","src/components/properties/property-card.tsx","src/routes/properties/index.tsx","src/routes/properties/$slug.tsx"]
---

# Public guest — Stay Stage + Glass Desk

## Scope & mode
Persuade (homepage) with Operate browse affordances. Nav + property plate shared across guest surfaces. Stay search params shared with `/properties` and `/properties/$slug`.

## Direction
Stay Stage + Glass Desk — full-bleed media stage (zero margin; floating inset deferred), black 55% overlay + radial, centered Marcellus headline + gold hairline + Poppins subline. Glass desk: desktop one row; phone 2×2 City|Guests, Check in|Check out, then Search (44px controls). Nav: paper ground, BrandMark + Marcellus “MOJO”. Footer: ink field, Marcellus `h2` columns. Request-to-Book honesty only.

## Constraints from PRODUCT.md
Real stay media (slideshow) kept as the stage plane. No invented testimonials or savings claims. WhatsApp in nav/menu when configured. Mobile-first nav. Request to Book copy only — dates prefill enquiry, they do not imply Instant Book.

## Inventory
| Region | Medium |
| Nav + mobile menu | semantic HTML (centered desktop links + gold active underline) |
| Hero stage | existing stay slides, right-weighted, royal left wash |
| Glass search bar | semantic form → `/properties` search |
| Property plates | semantic Link + img (+ optional stay search) |
| WhatsApp | real env number link |
| Footer | BrandMark gold + Marcellus wordmark; Stays / Support / Company as `h2` |
