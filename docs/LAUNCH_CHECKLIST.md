# Launch checklist (Request to Book)

Do these in order before opening the site to guests. Paystack Instant Book is deferred.

## 1. Database

In Supabase SQL Editor (if not already applied):

1. Init migration: [`supabase/migrations/20260803220000_init_mojo.sql`](../supabase/migrations/20260803220000_init_mojo.sql)
2. Server reprice: [`supabase/migrations/20260805120000_enquiry_server_reprice.sql`](../supabase/migrations/20260805120000_enquiry_server_reprice.sql)
3. Request-only launch: [`supabase/migrations/20260805130000_request_only_launch.sql`](../supabase/migrations/20260805130000_request_only_launch.sql)
4. Seed inventory: [`supabase/seed.sql`](../supabase/seed.sql)
5. Confirm Table Editor → `properties` has **8 published** rows, all `booking_mode = request`
6. Sign up once on the live site, then promote admin:

```sql
update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
```

## 2. App env (Vercel + local)

Confirm Production:

- `VITE_APP_ENV=production`
- `VITE_APP_URL=https://your-domain-or-vercel-url` (no trailing slash)
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_NUMBER` (optional; digits with country code)
- `SUPABASE_SERVICE_ROLE_KEY` (server only — never `VITE_`)

## 3. Auth redirect URLs

Supabase → Authentication → URL configuration:

- Site URL = production `VITE_APP_URL`
- Redirect allow list includes production + `http://localhost:5173/**`

## 4. Email for new enquiries (recommended)

Deploy `notify-enquiry` and wire a Database Webhook on `enquiries` INSERT, **or** poll `/admin/enquiries` daily until email is live.

```bash
npx supabase functions deploy notify-enquiry
```

## 5. Smoke test (must all pass)

| Flow | Expect |
| --- | --- |
| `/` and `/properties` | Live DB listings only (empty if unseeded — never demo inventory) |
| Property → Request to Book | Row in `enquiries`; amounts match `property_pricing` |
| Admin approve enquiry | Booking created + calendar block |
| Guest `/account/trips` | Sees enquiry + confirmed booking |
| Admin property CRUD | Create / publish / price works |
| Wishlist (signed in) | Saves and lists live properties |
| Sitemap `/sitemap.xml` | Includes published property URLs |

## 6. Go-live posture

- No demo catalog fallback
- No localStorage fake enquiries
- Instant Book UI hidden; all inventory forced to Request to Book
- Footer / WhatsApp only shown when a real number is configured

## Deferred (Paystack)

Keep Edge Functions in the repo. When ready: deploy Paystack functions, flip selected properties to `instant`, and re-enable Instant Book UI.
