---
name: MOJO Apartments
description: Dual system — guest Stay Stage + Glass Desk; ops Concierge phone-sheet.
colors:
  paper-ground: "#F7F5F2"
  paper-stone: "#F4F2EE"
  sheet-cream: "#FBFAF7"
  white: "#FFFFFF"
  brand-50: "#FAFAFA"
  brand-ink: "#24104D"
  royal: "#2D1659"
  gold: "#C89B2C"
  lavender: "#F3F0FA"
  status-ok-bg: "#ECFDF5"
  status-ok-ink: "#064E3B"
  status-bad-bg: "#FFF1F2"
  status-bad-ink: "#881337"
  alert-bg: "#FFFBEB"
  alert-ink: "#451A03"
typography:
  guest-display:
    fontFamily: '"Marcellus", ui-serif, Georgia, serif'
    fontSize: "clamp(3.5rem, 8vw, 6rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.02em"
  guest-wordmark:
    fontFamily: '"Marcellus", ui-serif, Georgia, serif'
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
  guest-footer-heading:
    fontFamily: '"Marcellus", ui-serif, Georgia, serif'
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.02em"
  guest-title:
    fontFamily: '"Marcellus", ui-serif, Georgia, serif'
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.01em"
  guest-plate:
    fontFamily: '"Marcellus", ui-serif, Georgia, serif'
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.01em"
  guest-price:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  guest-body:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  guest-ui:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  guest-menu:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  guest-base:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  guest-small:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  guest-micro:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  guest-tiny:
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  folio-name:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  section:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
  micro:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  guest-gutter: "20px"
  guest-section-y: "80px"
  rail: "220px"
  row-y: "12px"
  header: "56px"
  guest-nav: "64px"
components:
  guest-button-primary:
    backgroundColor: "{colors.royal}"
    textColor: "{colors.white}"
    typography: "{typography.guest-ui}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  guest-button-primary-hover:
    backgroundColor: "rgba(45, 22, 89, 0.9)"
    textColor: "{colors.white}"
  guest-button-ghost:
    backgroundColor: "rgba(255, 255, 255, 0.1)"
    textColor: "{colors.white}"
    typography: "{typography.guest-ui}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  guest-button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.guest-ui}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  guest-nav:
    backgroundColor: "{colors.paper-ground}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.guest-ui}"
    height: "64px"
  guest-glass-desk:
    backgroundColor: "rgba(251, 250, 247, 0.88)"
    textColor: "{colors.brand-ink}"
    typography: "{typography.guest-ui}"
    rounded: "20px"
  guest-footer:
    backgroundColor: "{colors.brand-ink}"
    textColor: "{colors.white}"
    typography: "{typography.guest-small}"
    padding: "64px 20px 32px"
  guest-property-plate:
    backgroundColor: "{colors.sheet-cream}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.guest-plate}"
    rounded: "0px"
    padding: "40px 48px"
  button-primary:
    backgroundColor: "{colors.royal}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "rgba(45, 22, 89, 0.9)"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-secondary-hover:
    backgroundColor: "rgba(36, 16, 77, 0.03)"
    textColor: "{colors.brand-ink}"
  status-new:
    backgroundColor: "rgba(200, 155, 44, 0.15)"
    textColor: "{colors.brand-ink}"
    typography: "{typography.micro}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  status-review:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.royal}"
    typography: "{typography.micro}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.brand-ink}"
    rounded: "0px"
  nav-active:
    backgroundColor: "{colors.royal}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.royal}"
    typography: "{typography.body}"
    padding: "8px 12px"
---

# Design System: MOJO Apartments

## Overview

**Creative North Star: "Stay Stage + Glass Desk" (guest) · "Concierge phone-sheet" (ops)**

MOJO ships two visual systems that share brand hues but never share costume. The public guest site is Stay Stage + Glass Desk: a paper-ground page with a **full-bleed** media stage under a 64px nav, centered Marcellus headline, gold hairline, Poppins Request-to-Book subline, frosted cream search desk, royal CTAs, and editorial property plates. The internal `/admin` console is Concierge phone-sheet: a dense ops rail, enquiry queue beside a request folio, system-UI type, and paper-flat work surfaces.

Guest density is editorial and calm; ops density is triage-first. Both refuse purple marketing themes, multi-layer glow shadows, and Instant Book theater. Shared palette (royal, gold, brand ink, lavender) signals MOJO; each surface applies it with different rules.

**Key Characteristics:**
- Guest: full-bleed stay slideshow on paper ground `#F7F5F2`; paper-ground nav with BrandMark + Marcellus “MOJO”; Marcellus + Poppins
- Guest: royal CTAs; gold as hairlines (hero rule, plate/menu, active-nav underline, link underlines, footer column rules) — not fill buttons and not a colored word in the headline
- Guest: alternating editorial plates; frosted cream glass desk (desktop one row; phone 2×2 City|Guests then Check in|Check out, then Search stays)
- Ops: paper stone + cream sheet + white panels; system UI; 13px dense rows
- Ops: Enquiries = queue beside request folio; Approve stays with the selected request
- Shared: brand ink `#24104D`, royal `#2D1659`, gold `#C89B2C`, lavender `#F3F0FA`
- Ops: royal actions; gold only on NEW status chips; queue beside folio

## Colors

Shared MOJO brand hues; role differs by surface.

### Primary
- **Deep Royal** (`{colors.royal}`): Guest primary CTAs (Browse stays, Request to Book, Search stays). Ops primary buttons, active rail, focus outlines, folio links.
- **Brand Ink** (`{colors.brand-ink}`): Default text on light surfaces; hairline borders at ~10–15% alpha; guest body on paper; ops secondary labels.

### Secondary
- **Luxury Gold** (`{colors.gold}`): Guest — 1px hairlines (under hero h1, plate titles, footer column heads), active desktop-nav underline, underline decoration on text links (`decoration-gold/70–80`), BrandMark `gold` on the ink footer. Ops — **NEW** status chips only (gold wash + gold ring). Never a guest CTA fill and never a tinted word inside the hero headline.

### Tertiary
- **Lavender** (`{colors.lavender}`): Guest secondary button hover wash on paper. Ops selected queue row, list hover, in-review chips.

### Neutral
- **Paper Ground** (`{colors.paper-ground}`): Guest site page field (`.guest-site` homepage ground).
- **Paper Stone** (`{colors.paper-stone}`): Ops console ground behind rail and main.
- **Sheet Cream** (`{colors.sheet-cream}`): Guest glass-desk frost, editorial plate copy panels, “How Request to Book works” band, mobile menu Request to Book fill; ops rail, sticky bars, thead wash. Guest nav uses paper ground, not cream.
- **Brand 50** (`{colors.brand-50}`): Legacy light utility ground (auth/support shells may still use it).
- **White** (`{colors.white}`): Secondary buttons on paper, ops panels/folio/inputs.
- **Status OK / Bad / Alert**: Ops chips and inline alerts only (see frontmatter).

### Named Rules
**The Gold Hairline Rule (guest).** Gold accents brand lockup, plate dividers, menu hairlines, and link underlines — never button fills or decorative icon washes.

**The Gold Urgency Rule (ops).** Gold appears only on NEW status chips. Every other ops accent is royal or lavender.

**The No Metric-Card Rule (ops).** Counts live in hairline-divided strips or tab badges — never elevated SaaS stat cards.

## Typography

**Guest Display Font:** Marcellus (`--font-guest-display`) — single-weight serif for headings
**Guest Body Font:** Poppins (`--font-sans` / `.guest-site`)
**Ops Body Font:** System UI stack (`ui-sans-serif, system-ui, …`)
**Label/Mono Font:** Same as surface body; ops short IDs may use `font-mono` at 11px muted

**Character:** Guest pairing is editorial — Marcellus for headings (regular only; no faux-bold), Poppins for paragraphs and UI. Ops is workhorse, slightly condensed tracking on titles, tabular nums on money. Do not import Marcellus/Poppins into `/admin`. Do not put Inter or system-only stacks on new guest marketing chrome.

### Hierarchy — Guest
- **Display** (`guest-display`, 400, clamp ~3.5–6rem, lh ~1.15, tracking +0.02em): Centered hero headline (“MOJO stays / across Ghana”) in white over the overlay; gold hairline sits under the block, not on a word.
- **Wordmark** (`guest-wordmark`, 400, 1.125rem, tracking +0.04em): “MOJO” beside BrandMark in nav and footer.
- **Title** (`guest-title`, 400, clamp ~1.75–2.25rem, tracking −0.02em): Section heads (Managed stays, How Request to Book, Ready when you are).
- **Footer heading** (`guest-footer-heading`, 400, 1.125rem): Footer column titles as `h2` (never skipped `h4`).
- **Plate** (`guest-plate`, 400, 2rem, tracking +0.01em): Editorial property plate titles in Marcellus.
- **Price** (`guest-price`, 600, 1.25rem): Nightly rate on plates.
- **Body** (`guest-body`, 400, 1.0625rem, lh ~1.55): Hero support line and section ledes.
- **UI** (`guest-ui`, 500, 0.9375rem): Nav links, primary CTAs, desk field values, “View all” links.
- **Menu** (`guest-menu`, 500, 1.125rem): Mobile cinema-split menu rows (gold on royal).
- **Base** (`guest-base`, 400, 1rem): How-it-works copy, empty-state copy.
- **Small** (`guest-small`, 400, 0.875rem): Secondary plate meta when needed; date inputs in the glass desk.
- **Micro** (`guest-micro`, 500, 0.8125rem): “/ night”, Request to Book plate link, strikethrough rates; glass-desk field labels.
- **Tiny** (`guest-tiny`, 600, 0.75rem, uppercase, tracking ~0.08em): Plate city lines; legacy uppercase desk labels where still used.

### Hierarchy — Ops
- **Title** (600, 1.375rem, tracking −0.02em): Page headers (`OpsPageHeader`).
- **Folio name** (600, 1.5rem, tracking −0.03em): Selected guest name in the request folio only.
- **Body** (400–600, 13px): Queue rows, table cells, buttons, field values, nav labels.
- **Caption** (400–500, 12px): Descriptions, muted meta, header console hint.
- **Label** (600, 11px, uppercase, tracking ~0.08em): Folio section eyebrows, table thead, metric strip labels.
- **Micro** (600, 10px, uppercase, tracking ~0.06em): Status chips, tab count badges, stay-fact cell labels.

### Named Rules
**The Two-Stack Rule.** Guest = Marcellus + Poppins. Ops = system UI only. Never cross-pollinate display faces into `/admin` or revive Inter on guest Stay Stage chrome.

**The Workhorse Type Rule (ops).** Admin uses the system UI stack and ~13px dense body. No serif display or marketing faces in the ops shell.

## Layout

### Guest — Stay Stage + Glass Desk
First viewport is one composition: fixed nav **64px** paper ground, then a **full-bleed** stay slideshow (`pt-16`, no stage gutter or radius). Type sits on a **black 35%** overlay plus a soft center radial (`rgba(0,0,0,0.18)`). **Centered** Marcellus headline + gold hairline + Poppins Request-to-Book support line (no savings claims, no hero CTA pair). Bottom of the stage: **frosted cream glass desk**. Desktop: one row City · Check in · Check out · Guests · royal Search stays. Pickers are paper Radix menus and a royal range calendar — not native `<select>` / `type="date"` chrome. Phone: City|Guests, then Check in|Check out, then full-width Search; controls **44×44**. Dates ride URL search into browse and property Request to Book; the list is not Instant Book inventory. Catalog below shows loading, empty, or error+retry — never a demo catalog. Slim how-it-works band (gold hairline tops, no “Step *n*” kickers), closing CTA. Ink **footer** with Marcellus `h2` columns. Section vertical rhythm ~**64–96px**.

### Ops — Concierge phone-sheet
Slim fixed ops rail (**220px**) with **56px** brand/header bands. Main pads **16–24px** horizontal, **20px** vertical. Tight block rhythm (**16–20px**).

**Enquiries (signature):** Full-height split (`calc(100vh − 7.5rem)`, min 520px). Status tabs with counts. White bordered sheet: queue (~0.95fr, min 280px) | folio (~1.25fr). Dense rows (**12px** vertical padding). Approve stays in the folio header cluster.

**Secondary boards:** Page header → optional underline tabs → square `OpsPanel` tables with cream thead. Shift board uses a four-cell hairline metric strip — not a dashboard of cards.

**Mobile:** Guest — hamburger opens **cinema-split** menu (film strip + royal panel + gold hairlines); glass desk uses the 2×2 + Search layout. Ops — rail drawers over brand-ink scrim; queue stacks above folio.

### Named Rules
**The Stay Stage Rule (guest).** Homepage hero media is one full-bleed plane under the nav — not a rounded inset card and not a marketplace collage. Overlay exists so white type meets contrast. Keep BrandMark + “MOJO” in the nav; keep the palette and honest Request-to-Book copy. Floating inset stage is deferred.

**The Queue-Beside-Folio Rule (ops).** Triage never replaces the list with a full-page detail. Selection = royal left hairline + lavender wash; folio updates in place.

## Elevation & Depth

### Guest
Depth is overlay + frost: stay photos under black 35% + radial; nav is paper ground (scrolled: paper/95 + 1px shadow + blur). The glass desk is cream/white frost over the stage (`backdrop-blur` + light border). Property plates are full-bleed editorial splits (no card chrome, no type badges); gold hairline under the title. Authored motion: stage/brand/desk settle with blur→sharp (`prefers-reduced-motion` gated); each hero slide Ken Burns zoom (~1.08 over 6s) as it becomes the visible frame; plate media ease-scale on hover (~1.03 over 700ms).

### Ops
Almost flat. Depth is tonal: paper stone → sheet cream → white, separated by **1px** brand-ink/10 hairlines. Shadows are rare and structural.

### Shadow Vocabulary
- **Glass desk** (`box-shadow: 0 8px 32px rgba(36,16,77,0.12)`): Hero frosted search bar.
- **Guest nav scrolled** (`box-shadow: 0 1px 3px rgba(36,16,77,0.08)`): Sticky paper bar after scroll.
- **Rail active** (`box-shadow: 0 1px 2px rgba(45, 22, 89, 0.25)`): Ops active nav pill only.
- **Panel rest** (`box-shadow: 0 1px 2px rgba(36, 16, 77, 0.04)`): `OpsPanel` resting lift.
- **Top bar blur** (`backdrop-filter: blur` + paper/95 when scrolled): Guest nav; ops sticky chrome stays cream.

### Named Rules
**The Hairline Depth Rule.** Prefer borders and paper layers over shadow. No multi-layer drop shadows or glows on either surface.

## Shapes

**Guest controls:** Soft rectangles (**8px** `rounded-lg`) on CTAs and nav actions. Hero stage is square (full-bleed). Glass desk ~**20–24px** (phone inner cells **8px**). **Property plates are square (0 radius)** — editorial sheets, not marketplace cards. No `rounded-full` pills on Stay Stage chrome.

**Ops controls:** **8px** on buttons, inputs, nav items; **6px** on status chips. Work surfaces — panels, queue/folio frame, metric strip, stay-fact grid — stay **square**. No pills.

## Components

### Buttons — Guest
- **Shape:** Soft rectangle (**8px**).
- **Primary:** Royal fill, white `guest-ui` label, padding ~**12×20px** (nav compact **8×14px**). Hover royal/90.
- **Ghost (on film):** White/10 fill, white/35 border, backdrop blur; hover white/15.
- **Secondary (on paper):** White fill, brand-ink/15 border; hover lavender/60.
- **Text link:** Royal (or brand-ink) with gold underline decoration; hover underline → royal.

### Buttons — Ops
- **Primary:** Royal fill, white 13px medium, padding **8×14px**. Hover royal/90. Focus-visible: 2px royal outline, 2px offset.
- **Secondary / Ghost:** White, brand-ink/15 border; hover brand-ink/3. Decline sits secondary beside Approve.

### Chips
- **Guest:** Prefer no chips on Stay Stage plates. Ops owns status chips.
- **Ops NEW:** Gold wash + gold ring — sole ops gold use.
- **Ops In review:** Lavender + royal text/ring.
- **Ops Approved / Declined:** Emerald / rose semantic pairs.

### Cards / Containers
- **Guest property plate:** Alternating editorial split — full-bleed photo | cream copy panel (or reverse). Gold hairline under Marcellus title; uppercase city; price + “Request to Book” micro link. No borders-as-cards, no type badges.
- **Ops panels:** Square white on paper stone; optional 1px rest shadow; row padding **12–16px**; folio blocks **20px**.

### Inputs / Fields
- **Guest glass desk:** Frosted cream/white bar; bold labels above values; desktop icons + chevron; brand-ink/10 cell dividers; royal “Search stays”; focus-visible royal rings. Phone drops decorative icons and splits dates into their own labeled cells.
- **Ops:** White, brand-ink/12 border, **8px** radius, 13px text, **8×12px** padding; focus border royal/40 + ring royal/15.

### Navigation
- **Guest SiteNav:** Fixed **64px** paper ground (`#F7F5F2`); BrandMark `brand` + Marcellus “MOJO”; desktop links centered (`Home` · `Properties` · `About` · `Contact`) with gold hairline active underline; right cluster always shows Request to Book (**44px** min height) plus wishlist and sign-in. Mobile: **cinema-split** — film strip | royal panel with gold hairline rows; Request to Book stays in the bar.
- **Ops rail:** Cream sheet, hairline right edge, 13px items **8px** radius. Active = royal fill + white + tiny royal shadow.
- **Ops status tabs:** Underline; active 2px royal bottom + semibold; micro count badges.

### Glass desk (guest signature)
Hero-bottom frosted search bar. Desktop one row; phone 2×2 + Search. Submits into `/properties` with dates carried into property Request to Book.

### Footer (guest)
Brand-ink field. BrandMark `gold` + Marcellus wordmark. Column titles are Marcellus `h2` with a gold hairline. Links Poppins, gold hover, **44px** min height. No skipped heading levels.

### Property plate (guest signature)
Alternating editorial unit: photo | copy (flips each row). Gold hairline under title, uppercase city, price, Request to Book gold underline. Hover: image scale only.

### Request folio (ops signature)
Split-sheet detail paired with queue: status + id, guest name, Approve/Decline, stay-fact grid, pricing dl, notes. Never a full-page takeover.

### Metric strip (ops)
Four equal white cells divided by hairlines — uppercase micro labels, ~18px semibold values. Not cards.

## Do's and Don'ts

### Do:
- **Do** keep guest first viewport as one full-bleed stage: BrandMark + MOJO in nav, centered headline + gold hairline + subline, frosted desk — no marketplace clutter or fake discount claims.
- **Do** use Marcellus for guest display/title/plate and Poppins for guest body/UI.
- **Do** use royal for primary actions on both surfaces; apply gold per surface rule (hairline guest / NEW-only ops).
- **Do** keep Enquiries as queue + folio side by side.
- **Do** set ops type to the system UI stack at ~13px dense.
- **Do** separate surfaces with brand-ink/10 hairlines on paper grounds and sheet cream.
- **Do** say Request to Book (honest launch language), not Instant Book.

### Don't:
- **Don't** replace the single full-bleed Stay Stage with a collage of small media cards, a purple wash, or a rounded inset card (inset is deferred).
- **Don't** use gold as a guest CTA fill or as ops chrome decoration outside NEW chips.
- **Don't** import Marcellus/Poppins/Inter/marketing heroes into `/admin`.
- **Don't** build SaaS metric-card dashboards inside `/admin`.
- **Don't** introduce `rounded-full` pills or multi-layer glow shadows on Stay Stage or ops controls.
- **Don't** open enquiry detail as a full-page takeover that hides the queue.
- **Don't** invent testimonials, ratings, occupancy claims, or “save up to X%” copy on guest surfaces.
