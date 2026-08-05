---
name: MOJO Ops Console
description: Concierge phone-sheet admin — enquiry queue beside a request folio on paper stone.
colors:
  paper-stone: "#F4F2EE"
  sheet-cream: "#FBFAF7"
  white: "#FFFFFF"
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
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  rail: "220px"
  row-y: "12px"
  header: "56px"
components:
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

# Design System: MOJO Ops Console

## Overview

**Creative North Star: "Concierge phone-sheet"**

This is the internal Request-to-Book ops console for MOJO Apartments — a working tool, not a marketing shell. The metaphor is a concierge desk pad: a slim ops rail, a dense enquiry queue, and a request folio open beside it so approve/decline never loses the list. Surfaces stay paper-flat; brand shows up as royal actions and restrained lavender selection, not as guest-site costume.

Density is the point. Rows, hairline rules, and tabular totals replace airy cards and SaaS metric tiles. System UI sans is intentional on admin so scanning stays fast; the public site may keep Inter and promotional patterns separately.

**Key Characteristics:**
- Paper stone ground with cream sheet chrome and white work surfaces
- Royal for primary actions and active chrome; gold reserved for NEW urgency
- Hairline brand-ink rules and dense 13px rows — no marketing cards
- Split queue + folio on Enquiries; tables elsewhere
- Soft 6–8px corners on controls; square panels and sheets

## Colors

Ops reuses MOJO brand hues as tool accents on a warm paper field — never as a purple marketing theme.

### Primary
- **Deep Royal** (`{colors.royal}`): Primary buttons (Approve, Inbox, New property), active rail item fill, active status-tab underline and label, focus outlines, folio contact links.
- **Brand Ink** (`{colors.brand-ink}`): Default text, hairline borders at 10–15% alpha, secondary button label.

### Secondary
- **Luxury Gold** (`{colors.gold}`): **NEW** status chips only (gold wash + gold ring). Do not use gold for CTAs, icons decoration, or general chrome.

### Tertiary
- **Lavender** (`{colors.lavender}`): Selected queue row wash, list/table hover tint, in-review status chip ground.

### Neutral
- **Paper Stone** (`{colors.paper-stone}`): Full console ground behind the rail and main.
- **Sheet Cream** (`{colors.sheet-cream}`): Ops rail and sticky top bar; queue column sticky header; table thead wash.
- **White** (`{colors.white}`): Panels, folio sheet, queue/folio split frame, inputs, secondary buttons.
- **Status OK** (`{colors.status-ok-bg}` / `{colors.status-ok-ink}`): Approved (and similar success) chips.
- **Status Bad** (`{colors.status-bad-bg}` / `{colors.status-bad-ink}`): Declined / expired chips and decline-reason text.
- **Alert Amber** (`{colors.alert-bg}` / `{colors.alert-ink}`): Inline ops alerts only.

### Named Rules
**The Gold Urgency Rule.** Gold appears only on NEW status chips. Every other accent is royal or lavender.

**The No Metric-Card Rule.** Counts live in hairline-divided strips or tab badges — never in elevated SaaS stat cards with shadows or icon tiles.

## Typography

**Display Font:** none on admin (public marketing may use expressive faces elsewhere)
**Body Font:** System UI stack (`ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`)
**Label/Mono Font:** Same stack for labels; short IDs may use `font-mono` at 11px muted

**Character:** Workhorse, slightly condensed tracking on titles, tabular nums on money. No Inter on the ops shell — the shell overrides to system UI even though the global site theme registers Inter.

### Hierarchy
- **Title** (600, 1.375rem, tracking −0.02em): Page headers (`OpsPageHeader`).
- **Folio name** (600, 1.5rem, tracking −0.03em): Selected guest name in the request folio only.
- **Body** (400–600, 13px): Queue rows, table cells, buttons, field values, nav labels.
- **Secondary** (400–500, 12px): Descriptions, muted meta under names, header console hint.
- **Label** (600, 11px, uppercase, tracking ~0.08em): Section eyebrows inside folio (Pricing, Guest notes, Queue), table thead, metric strip labels.
- **Micro** (600, 10px, uppercase, tracking ~0.06em): Status chips, tab count badges, stay-fact cell labels.

### Named Rules
**The Workhorse Type Rule.** Admin uses the system UI stack. Do not import Inter, serif display, or marketing display faces into `/admin`.

## Layout

Slim fixed ops rail (**220px**) with **56px** brand/header bands. Main content pads **16–24px** horizontally and **20px** vertically. Vertical rhythm is tight: **16–20px** between page blocks (`space-y-4` / `space-y-5`).

**Enquiries (signature):** Full-height split (`calc(100vh − 7.5rem)`, min 520px). Status tabs with counts on a hairline rule. Below: white bordered sheet, two columns on large screens — queue (~0.95fr, min 280px) | folio (~1.25fr). Queue rows are dense (**12px** vertical padding), three-column grid (status · identity · total). Folio keeps Approve primary in the header cluster so the queue stays visible.

**Secondary boards:** Page header → optional underline tabs → square `OpsPanel` tables with cream thead. Shift board uses a four-cell hairline metric strip, then a “Needs action” list panel — not a dashboard of cards.

**Mobile:** Rail drawers over a brand-ink scrim; queue stacks above folio; metric strip collapses to 2×2.

### Named Rules
**The Queue-Beside-Folio Rule.** Triage never replaces the list with a full-page detail. Selection paints a royal left hairline + lavender wash; the folio updates in place.

## Elevation & Depth

Almost flat. Depth is tonal: paper stone → sheet cream → white, separated by **1px** brand-ink/10 hairlines. Shadows are rare and structural, not decorative glow.

### Shadow Vocabulary
- **Rail active** (`box-shadow: 0 1px 2px rgba(45, 22, 89, 0.25)`): Active nav pill only.
- **Panel rest** (`box-shadow: 0 1px 2px rgba(36, 16, 77, 0.04)`): `OpsPanel` resting lift — barely there.
- **Top bar blur** (`backdrop-filter: blur` + cream at 90%): Sticky header only.

### Named Rules
**The Hairline Depth Rule.** Prefer borders and paper layers over shadow. No multi-layer drop shadows, glows, or floating cards.

## Shapes

Controls use gently rounded corners (**8px** `rounded-lg` on buttons, inputs, nav items; **6px** `rounded-md` on status chips and count badges). Work surfaces — panels, queue/folio frame, metric strip, stay-fact grid — stay **square (0 radius)** so the desk reads as ruled sheets, not app cards. No pills (`rounded-full`).

## Components

### Buttons
- **Shape:** Soft rectangle (**8px**).
- **Primary:** Royal fill, white 13px medium label, padding **8×14px**. Hover royal at 90% opacity. Focus-visible: 2px royal outline, 2px offset.
- **Secondary / Ghost:** White fill, brand-ink/15 border, brand-ink label; hover brand-ink/3 wash. Decline sits secondary beside Approve primary.

### Chips
- **Style:** Micro uppercase, **6px** radius, thin ring (1px).
- **NEW:** Gold wash + gold ring — sole gold use.
- **In review:** Lavender + royal text/ring.
- **Approved / Declined:** Emerald / rose semantic pairs.
- **Tab counts:** Compact badges; active = royal/10 + royal text; idle = brand-ink/5 muted.

### Cards / Containers
- **Corner Style:** Square panels; no card radius on work surfaces.
- **Background:** White on paper stone; cream for chrome strips.
- **Shadow Strategy:** Optional 1px panel rest shadow only.
- **Border:** Brand-ink at ~10% opacity.
- **Internal Padding:** Row **12–16px**; folio blocks **20px**.

### Inputs / Fields
- **Style:** White, brand-ink/12 border, **8px** radius, 13px text, **8×12px** padding.
- **Focus:** Border royal/40 + ring royal/15 (2px).
- **Labels:** 12px medium muted; folio section labels use uppercase micro tracking.
- **Empty:** Dashed brand-ink/15 border, white/50 fill, centered 13px muted copy.

### Navigation
- **Rail:** Cream sheet, hairline right edge, 13px items with **8px** radius. Active = royal fill + white + tiny royal shadow. Enquiries stays slightly heavier when idle (daily job).
- **Status tabs:** Underline tabs; active = 2px royal bottom border + royal semibold; counts in micro badges.
- **Top bar:** Cream sticky bar; compact royal Inbox shortcut.

### Request folio (signature)
Split-sheet detail: status + truncated id, large guest name, property line, Approve/Decline cluster for open states, contact fields, hairline stay-fact grid (check-in/out, nights, guests), pricing dl with total rule, guest notes, internal notes footer. Always paired with the queue.

### Metric strip
Four equal white cells divided by hairlines — uppercase micro labels, **18px**-ish semibold values. Links tint lavender on hover. Not cards.

## Do's and Don'ts

### Do:
- **Do** keep Enquiries as queue + folio side by side so triage never loses the list.
- **Do** use royal for primary actions and active chrome; lavender for selection/hover wash.
- **Do** reserve gold exclusively for NEW status chips.
- **Do** set admin type to the system UI stack and keep body copy at ~13px dense.
- **Do** separate surfaces with brand-ink/10 hairlines on paper stone / sheet cream / white.

### Don't:
- **Don't** build SaaS metric-card dashboards (icon tiles, soft shadows, rounded marketing cards) inside `/admin`.
- **Don't** reuse public-site Inter/marketing hero patterns, full-bleed imagery, or gold icon decoration in the ops shell.
- **Don't** use gold on buttons, nav, or decorative iconography.
- **Don't** introduce `rounded-full` pills or multi-layer glow shadows on ops controls.
- **Don't** open enquiry detail as a full-page takeover that hides the queue.
