# MOJO production setup

## Environments

| Env | Host | Supabase | Paystack | App URL |
| --- | --- | --- | --- | --- |
| local | `npm run dev` | your project | test keys | http://localhost:5173 |
| preview | Vercel Preview | same project (for now) | test keys | `*.vercel.app` |
| production | Vercel Production | production project + PITR | live keys | custom domain |

Copy [`.env.example`](../.env.example) → `.env.local` (never commit secrets).

### Secrets (critical)

- **Never** commit `SUPABASE_SERVICE_ROLE_KEY`, Paystack secrets, or Resend keys.
- **Never** expose service role via `VITE_*` — those are bundled into the client.
- Real keys belong in `.env.local` (gitignored) and Vercel Project env settings only.
- If a service-role or anon key leaked into git, chat, or a tracked file: rotate it in Supabase → Settings → API, then update Vercel + `.env.local`.

Full Vercel steps: [docs/VERCEL.md](./VERCEL.md).

## Database

```bash
# With Supabase CLI linked to a project:
npx supabase db push
# then seed (SQL editor or CLI):
# apply supabase/seed.sql
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

## Deploy app (Vercel)

- Host: **Vercel** with Nitro preset `vercel` ([`vite.config.ts`](../vite.config.ts), [`vercel.json`](../vercel.json))
- See [docs/VERCEL.md](./VERCEL.md) for import, env matrix, and Auth redirect URLs
- Client env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, `VITE_APP_ENV`, `VITE_WHATSAPP_NUMBER`
- Server env: `SUPABASE_SERVICE_ROLE_KEY` (and later Paystack/Resend) — never `VITE_`

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
- Uptime: probe `/` and `/properties` every 5 minutes (Vercel or external monitor)
