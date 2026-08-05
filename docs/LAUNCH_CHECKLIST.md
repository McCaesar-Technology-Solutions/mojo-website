# Launch checklist (Instant Book included)

Do these in order before opening the site to guests.

## 1. Database

In Supabase SQL Editor:

1. Run additive migration: [`supabase/migrations/20260805120000_enquiry_server_reprice.sql`](../supabase/migrations/20260805120000_enquiry_server_reprice.sql)
2. Run seed: [`supabase/seed.sql`](../supabase/seed.sql)
3. Confirm Table Editor → `properties` has **8 published** rows
4. Sign up once on the live site, then promote admin:

```sql
update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
```

## 2. App env (Vercel + local)

Already set from Slice 1. Confirm Production:

- `VITE_APP_ENV=production`
- `VITE_APP_URL=https://your-domain-or-vercel-url` (no trailing slash)
- Supabase URL + anon + **service role** (server only)

## 3. Paystack + Edge Functions (required for Instant Book)

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF

npx supabase secrets set \
  PAYSTACK_SECRET_KEY=sk_live_or_test_xxx \
  APP_URL=https://your-production-url \
  RESEND_API_KEY=re_xxx \
  ADMIN_NOTIFY_EMAIL=ops@yourdomain.com \
  EMAIL_FROM='MOJO <bookings@yourdomain.com>'

# SUPABASE_URL / ANON / SERVICE_ROLE are usually injected; set explicitly if needed

npx supabase functions deploy paystack-initialize
npx supabase functions deploy paystack-webhook
npx supabase functions deploy paystack-refund
npx supabase functions deploy notify-enquiry
npx supabase functions deploy release-expired-holds
```

Paystack Dashboard:

- Webhook URL: `https://YOUR_PROJECT.supabase.co/functions/v1/paystack-webhook`
- Events: at least `charge.success`
- Currency: **GHS**

Schedule `release-expired-holds` every 15 minutes (Supabase cron or external ping) so abandoned Instant Book holds expire.

## 4. Auth redirect URLs

Supabase → Authentication → URL configuration:

- Site URL = production `VITE_APP_URL`
- Redirect allow list includes production + `http://localhost:5173/**`

## 5. Smoke test (must all pass)

| Flow | Expect |
| --- | --- |
| `/properties` | Only DB listings (no fake/demo inventory) |
| Request property → Send Enquiry | Row in `enquiries`; amounts match `property_pricing` |
| Admin approve | Booking created + calendar block |
| Instant Book on MOJO Luxury Suite (signed in) | Redirect to Paystack → return → status **confirmed** |
| Admin refund (test mode) | Booking `refunded`, dates freed |

## 6. Go-live posture

- Demo fallback is **disabled** when `VITE_APP_ENV` is `preview` or `production`
- Enquiry fake localStorage success is **disabled** outside `local`
- Webhook rejects amount mismatches
- Watch `/admin/enquiries` (email notify needs Resend + calling notify with service role / DB webhook)

## Email for new enquiries (optional but recommended)

`notify-enquiry` is service-role only (no public spam). Wire a Supabase **Database Webhook** on `enquiries` INSERT → `notify-enquiry`, or poll the admin inbox every morning until then.
