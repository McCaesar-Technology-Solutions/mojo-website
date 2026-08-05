---
version: 1
slug: "src-routes-admin"
primary_target: "src/routes/admin"
related_targets: ["src/routes/admin/index.tsx","src/routes/admin/enquiries.tsx","src/routes/admin/route.tsx"]
---

# Admin ops console

## Scope & mode
Operate. Internal `/admin` for MOJO Request-to-Book ops.

## Audience / job
Small ops team. #1 daily job: triage enquiries (approve/decline).

## Direction
Concierge phone-sheet. Combined comps: C status tabs + A split queue/sheet + B folio detail.
Approved mocks: `.impeccable/mocks/admin-comp-a-classic-split.png`, `admin-comp-b-sheet-dominant.png`, `admin-comp-c-queue-table.png` (combined).

## Composition inventory
| Region | Medium |
| Nav rail | semantic HTML + iconify |
| Header search | semantic form → /admin/enquiries?q= |
| Status tabs | semantic HTML; New count uses gold |
| Enquiry queue | semantic list; lavender selection fill |
| Detail folio | semantic HTML; sticky Approve/Decline footer |
| Brand mark | existing BrandMark SVG |

## Grammar
Paper/stone ground, royal primary, gold only for NEW urgency. Hairline rules. Dense rows. No marketing metric-card hero. System/workhorse type on admin only.
