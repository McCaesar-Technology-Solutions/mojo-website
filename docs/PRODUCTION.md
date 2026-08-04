# MOJO production setup

## Environments

| Env | Supabase | Paystack | App URL |
| --- | --- | --- | --- |
| local | local or free project | test keys | http://localhost:5173 |
| staging | staging project | test keys | staging host |
| production | production project + PITR | live keys | custom domain |

Copy `.env.example` → `.env.local` (never commit secrets).

## Database

```bash
# With Supabase CLI linked to a project:
npx supabase db push
npx supabase db execute -f supabase/seed.sql
```

Bootstrap admin after first user signs up:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

## Edge Functions

```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_... RESEND_API_KEY=re_... ADMIN_NOTIFY_EMAIL=ops@... APP_URL=https://...
npx supabase functions deploy paystack-initialize
npx supabase functions deploy paystack-webhook
npx supabase functions deploy paystack-refund
npx supabase functions deploy notify-enquiry
npx supabase functions deploy release-expired-holds
```

Point Paystack webhook URL to:  
`https://<project>.supabase.co/functions/v1/paystack-webhook`

Schedule `release-expired-holds` every 15 minutes (Supabase cron / external scheduler).

## Deploy app

- Lovable publish, or `npm run build` → Nitro/Cloudflare output
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, `VITE_WHATSAPP_NUMBER`
- Server secrets via host env / `.dev.vars` (never `VITE_`)

## Smoke checklist

1. Home loads featured properties (Supabase or demo fallback)
2. Sign up / sign in
3. Submit enquiry on a `request` property → appears in admin inbox
4. Approve enquiry → booking + calendar block
5. Instant Book on `instant` property → Paystack test charge → `/booking/success`
6. Admin refund path (test mode)
7. Legal pages reachable from footer

## Monitoring

- Keep Lovable error bridge (`reportLovableError`)
- Optional: set `SENTRY_DSN` when adding Sentry SDK
- Edge Function structured JSON logs (`level`, `event`)
- Uptime: probe `/` and `/properties` every 5 minutes
