---
name: MOJO Apartments
description: Dual system — guest Stay Cinema + Reception Desk; ops Concierge phone-sheet.
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
    fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif'
    fontSize: "3.5rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  guest-title:
    fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif'
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  guest-plate:
    fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif'
    fontSize: "2rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  guest-price:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  guest-body:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  guest-ui:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  guest-menu:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  guest-base:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  guest-small:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  guest-micro:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  guest-tiny:
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
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
    backgroundColor: "rgba(251, 250, 247, 0.8)"
    textColor: "{colors.brand-ink}"
    typography: "{typography.guest-ui}"
    height: "64px"
  guest-reception-desk:
    backgroundColor: "rgba(20, 12, 36, 0.72)"
    textColor: "{colors.white}"
    typography: "{typography.guest-ui}"
    rounded: "{rounded.xl}"
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

**Creative North Star: "Stay Cinema + Reception Desk" (guest) · "Concierge phone-sheet" (ops)**

MOJO ships two visual systems that share brand hues but never share costume. The public guest site is Stay Cinema + Reception Desk: a full-bleed hero film, paper-cream chrome, royal CTAs, gold as hairline emphasis, Bricolage Grotesque display paired with Source Sans 3, and editorial property plates. The internal `/admin` console is Concierge phone-sheet: a dense ops rail, enquiry queue beside a request folio, system-UI type, and paper-flat work surfaces.

Guest density is editorial and calm; ops density is triage-first. Both refuse purple marketing themes, multi-layer glow shadows, and Instant Book theater. Shared palette (royal, gold, brand ink, lavender) signals MOJO; each surface applies it with different rules.

**Key Characteristics:**
- Guest: full-bleed hero video; paper ground `#F7F5F2` + sheet-cream nav chrome; Bricolage + Source Sans 3
- Guest: royal CTAs; gold on brand lockup, plate hairlines, menu hairlines, and link underlines — not fill buttons
- Guest: alternating editorial plates (image|copy / copy|image); dark floating reception desk on the hero
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
- **Luxury Gold** (`{colors.gold}`): Guest — “Apartments” in the hero lockup, plate/menu hairlines, underline decoration on text links (`decoration-gold/70–80`). Ops — **NEW** status chips only (gold wash + gold ring). Never a guest CTA fill.

### Tertiary
- **Lavender** (`{colors.lavender}`): Guest secondary button hover wash on paper. Ops selected queue row, list hover, in-review chips.

### Neutral
- **Paper Ground** (`{colors.paper-ground}`): Guest site page field (`.guest-site` homepage ground).
- **Paper Stone** (`{colors.paper-stone}`): Ops console ground behind rail and main.
- **Sheet Cream** (`{colors.sheet-cream}`): Guest nav glass, editorial plate copy panels, “How Request to Book works” band, mobile menu Request to Book fill; ops rail, sticky bars, thead wash.
- **Brand 50** (`{colors.brand-50}`): Legacy light utility ground (auth/support shells may still use it).
- **White** (`{colors.white}`): Secondary buttons on paper, ops panels/folio/inputs.
- **Status OK / Bad / Alert**: Ops chips and inline alerts only (see frontmatter).

### Named Rules
**The Gold Hairline Rule (guest).** Gold accents brand lockup, plate dividers, menu hairlines, and link underlines — never button fills or decorative icon washes.

**The Gold Urgency Rule (ops).** Gold appears only on NEW status chips. Every other ops accent is royal or lavender.

**The No Metric-Card Rule (ops).** Counts live in hairline-divided strips or tab badges — never elevated SaaS stat cards.

## Typography

**Guest Display Font:** Bricolage Grotesque (`--font-guest-display`)
**Guest Body Font:** Source Sans 3 (`--font-sans` / `.guest-site`)
**Ops Body Font:** System UI stack (`ui-sans-serif, system-ui, …`)
**Label/Mono Font:** Same as surface body; ops short IDs may use `font-mono` at 11px muted

**Character:** Guest pairing is editorial — medium Bricolage for brand and section heads, Source Sans 3 for clarity and UI. Ops is workhorse, slightly condensed tracking on titles, tabular nums on money. Do not import Bricolage into `/admin`. Do not put Inter or system-only stacks on new guest marketing chrome.

### Hierarchy — Guest
- **Display** (`guest-display`, 500, clamp ~2.75–3.5rem, lh ~1.05–1.1, tracking −0.03em): Hero brand lockup “MOJO” (+ gold “Apartments”).
- **Title** (`guest-title`, 500, clamp ~1.75–2.25rem, tracking −0.02em): Section heads (Managed stays, How Request to Book, Ready when you are).
- **Plate** (`guest-plate`, 500, 2rem, tracking −0.02em): Editorial property plate titles in Bricolage.
- **Price** (`guest-price`, 600, 1.25rem): Nightly rate on plates.
- **Body** (`guest-body`, 400, 1.0625rem, lh ~1.55): Hero support line and section ledes.
- **UI** (`guest-ui`, 500, 0.9375rem): Nav links, primary/ghost CTAs, desk field values, “View all” links.
- **Menu** (`guest-menu`, 500, 1.125rem): Mobile cinema-split menu rows (gold on royal).
- **Base** (`guest-base`, 400, 1rem): How-it-works copy, empty-state copy.
- **Small** (`guest-small`, 400, 0.875rem): Secondary plate meta when needed.
- **Micro** (`guest-micro`, 500, 0.8125rem): “/ night”, Request to Book plate link, strikethrough rates.
- **Tiny** (`guest-tiny`, 600, 0.75rem, uppercase, tracking ~0.08em): Desk field labels (City, Guests), plate city lines.

### Hierarchy — Ops
- **Title** (600, 1.375rem, tracking −0.02em): Page headers (`OpsPageHeader`).
- **Folio name** (600, 1.5rem, tracking −0.03em): Selected guest name in the request folio only.
- **Body** (400–600, 13px): Queue rows, table cells, buttons, field values, nav labels.
- **Caption** (400–500, 12px): Descriptions, muted meta, header console hint.
- **Label** (600, 11px, uppercase, tracking ~0.08em): Folio section eyebrows, table thead, metric strip labels.
- **Micro** (600, 10px, uppercase, tracking ~0.06em): Status chips, tab count badges, stay-fact cell labels.

### Named Rules
**The Two-Stack Rule.** Guest = Bricolage + Source Sans 3. Ops = system UI only. Never cross-pollinate display faces into `/admin` or revive Inter on guest Stay Cinema chrome.

**The Workhorse Type Rule (ops).** Admin uses the system UI stack and ~13px dense body. No serif display or marketing faces in the ops shell.

## Layout

### Guest — Stay Cinema + Reception Desk
First viewport is one composition: full-bleed hero video (`min-h-[100svh]`), brand-ink gradient scrim, **centered** brand lockup + one clarity line + CTA pair mid-frame, then the **reception desk** anchored at the bottom — a dark floating strip (city/guests + royal Search stays; field icons; no dead date cell). Fixed nav **64px**; content max-width **7xl** with horizontal gutters **20–24px**. Below: **alternating editorial plates** (image|copy / copy|image) — never a marketplace card grid. Slim how-it-works band (gold hairline tops, no “Step *n*” kickers), closing CTA. Section vertical rhythm ~**64–96px**.

### Ops — Concierge phone-sheet
Slim fixed ops rail (**220px**) with **56px** brand/header bands. Main pads **16–24px** horizontal, **20px** vertical. Tight block rhythm (**16–20px**).

**Enquiries (signature):** Full-height split (`calc(100vh − 7.5rem)`, min 520px). Status tabs with counts. White bordered sheet: queue (~0.95fr, min 280px) | folio (~1.25fr). Dense rows (**12px** vertical padding). Approve stays in the folio header cluster.

**Secondary boards:** Page header → optional underline tabs → square `OpsPanel` tables with cream thead. Shift board uses a four-cell hairline metric strip — not a dashboard of cards.

**Mobile:** Guest — hamburger opens **cinema-split** menu (film strip + royal panel + gold hairlines). Ops — rail drawers over brand-ink scrim; queue stacks above folio.

### Named Rules
**The Cinema First Rule (guest).** Hero video is edge-to-edge plane; do not inset it in cards, side panels, or rounded media frames.

**The Queue-Beside-Folio Rule (ops).** Triage never replaces the list with a full-page detail. Selection = royal left hairline + lavender wash; folio updates in place.

## Elevation & Depth

### Guest
Depth is cinema + paper: video under a brand-ink gradient; nav is sheet-cream glass (`backdrop-blur`, cream at ~80–95%). Reception desk is a dark translucent floating strip (`rgba(20,12,36,0.72)` + soft lift). Property plates are full-bleed editorial splits (no card chrome, no type badges); gold hairline under the title. Authored motion: hero brand/desk settle with blur→sharp (`prefers-reduced-motion` gated); plate media ease-scale on hover (~1.03 over 700ms).

### Ops
Almost flat. Depth is tonal: paper stone → sheet cream → white, separated by **1px** brand-ink/10 hairlines. Shadows are rare and structural.

### Shadow Vocabulary
- **Reception desk** (`box-shadow: 0 8px 30px rgba(0,0,0,0.25)`): Hero desk strip only.
- **Guest nav scrolled** (`box-shadow: 0 1px 3px rgba(36,16,77,0.08)`): Sticky cream bar after scroll.
- **Rail active** (`box-shadow: 0 1px 2px rgba(45, 22, 89, 0.25)`): Ops active nav pill only.
- **Panel rest** (`box-shadow: 0 1px 2px rgba(36, 16, 77, 0.04)`): `OpsPanel` resting lift.
- **Top bar blur** (`backdrop-filter: blur` + cream at ~90%): Guest nav and ops sticky chrome.

### Named Rules
**The Hairline Depth Rule.** Prefer borders and paper layers over shadow. No multi-layer drop shadows or glows on either surface.

## Shapes

**Guest controls:** Soft rectangles (**8px** `rounded-lg`) on CTAs and nav actions. Reception desk uses a soft float (**12px** / `rounded-xl`). **Property plates are square (0 radius)** — editorial sheets, not marketplace cards. No `rounded-full` pills on Stay Cinema chrome.

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
- **Guest:** Prefer no chips on Stay Cinema plates. Ops owns status chips.
- **Ops NEW:** Gold wash + gold ring — sole ops gold use.
- **Ops In review:** Lavender + royal text/ring.
- **Ops Approved / Declined:** Emerald / rose semantic pairs.

### Cards / Containers
- **Guest property plate:** Alternating editorial split — full-bleed photo | cream copy panel (or reverse). Gold hairline under Bricolage title; uppercase city; price + “Request to Book” micro link. No borders-as-cards, no type badges.
- **Ops panels:** Square white on paper stone; optional 1px rest shadow; row padding **12–16px**; folio blocks **20px**.

### Inputs / Fields
- **Guest reception desk:** Dark floating strip; tiny uppercase labels; map/guests icons; white/15 cell dividers; royal submit cell (“Search stays”).
- **Ops:** White, brand-ink/12 border, **8px** radius, 13px text, **8×12px** padding; focus border royal/40 + ring royal/15.

### Navigation
- **Guest SiteNav:** Fixed **64px** sheet-cream glass; BrandMark `brand` on light; desktop links `guest-ui`; royal Request to Book. Mobile: **cinema-split** — film strip (Explore CTA) | royal panel with gold hairline rows + cream Request to Book.
- **Ops rail:** Cream sheet, hairline right edge, 13px items **8px** radius. Active = royal fill + white + tiny royal shadow.
- **Ops status tabs:** Underline; active 2px royal bottom + semibold; micro count badges.

### Reception desk (guest signature)
Hero-bottom dark floating strip: city + guests + Search stays. Field icons, soft lift, no date field. Submits into `/properties` search.

### Property plate (guest signature)
Alternating editorial unit: photo | copy (flips each row). Gold hairline under title, uppercase city, price, Request to Book gold underline. Hover: image scale only.

### Request folio (ops signature)
Split-sheet detail paired with queue: status + id, guest name, Approve/Decline, stay-fact grid, pricing dl, notes. Never a full-page takeover.

### Metric strip (ops)
Four equal white cells divided by hairlines — uppercase micro labels, ~18px semibold values. Not cards.

## Do's and Don'ts

### Do:
- **Do** keep guest first viewport as cinema + brand + one line + CTAs + reception desk — no marketplace clutter.
- **Do** use Bricolage for guest display/title/plate and Source Sans 3 for guest body/UI.
- **Do** use royal for primary actions on both surfaces; apply gold per surface rule (hairline guest / NEW-only ops).
- **Do** keep Enquiries as queue + folio side by side.
- **Do** set ops type to the system UI stack at ~13px dense.
- **Do** separate surfaces with brand-ink/10 hairlines on paper grounds and sheet cream.
- **Do** say Request to Book (honest launch language), not Instant Book.

### Don't:
- **Don't** inset the hero video in cards, side panels, or rounded media frames.
- **Don't** use gold as a guest CTA fill or as ops chrome decoration outside NEW chips.
- **Don't** import Bricolage/Inter/marketing heroes into `/admin`.
- **Don't** build SaaS metric-card dashboards inside `/admin`.
- **Don't** introduce `rounded-full` pills or multi-layer glow shadows on Stay Cinema or ops controls.
- **Don't** open enquiry detail as a full-page takeover that hides the queue.
- **Don't** invent testimonials, ratings, or occupancy claims on guest surfaces.
