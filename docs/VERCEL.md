# Deploy MOJO on Vercel

Hosting target: **Vercel** (TanStack Start + Nitro `vercel` preset).

## One-time setup

1. Push this repo to GitHub (if not already).
2. [Import the project](https://vercel.com/new) on Vercel.
3. Confirm **Framework Preset** is `TanStack Start` (also set in `vercel.json`).
4. Build command should be `npm run build` (auto-detected). Leave output directory to Vercel/Nitro defaults.
5. Deploy a Preview, then Production when ready.

Local CLI alternative:

```bash
npx vercel          # preview
npx vercel --prod   # production
```

## Environment variables

Set these in **Project → Settings → Environment Variables**.  
Scope them separately for **Preview** and **Production** where noted.

| Variable | Preview | Production | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | yes | Same project OK until staging split |
| `VITE_SUPABASE_ANON_KEY` | yes | yes | Client-safe |
| `VITE_APP_URL` | Preview URL e.g. `https://….vercel.app` | Custom domain | No trailing slash |
| `VITE_APP_ENV` | `preview` | `production` | Used by `getAppEnv()` |
| `VITE_WHATSAPP_NUMBER` | optional | optional | Digits only, country code |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | yes | **Server only** — never `VITE_` |
| `APP_ENV` | `preview` | `production` | Optional mirror of `VITE_APP_ENV` |

Paystack / Resend keys come later (payment + email slices).

### Secrets rules

- Copy [`.env.example`](../.env.example) → `.env.local` for local work.
- Never commit `.env.local` or real keys (see `.gitignore`).
- Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable.
- If a service-role key was ever pasted into a tracked file or chat, rotate it in Supabase → Settings → API.

## Supabase Auth redirect URLs

In Supabase → Authentication → URL configuration, add:

- Site URL: your Production `VITE_APP_URL` (or localhost while developing)
- Redirect allow list:
  - `http://localhost:5173/**`
  - `https://<your-preview-deployment>.vercel.app/**`
  - `https://*.vercel.app/**` (optional, covers PR previews)
  - Production domain `https://your-domain.com/**` when live

## Verify a deployment

1. Open the Preview URL — home page loads (demo catalog is OK until Slice 2 migration).
2. Hit `/properties` and `/auth/sign-in` — pages render without 500s.
3. Confirm browser network calls (if env set) go to your Supabase project, not missing-env demo-only forever once migration is applied.
4. Check Vercel build logs: Nitro should target **vercel**, not Cloudflare / Wrangler.

## Local production build (Vercel-shaped)

```bash
npm run build
```

Expect Vercel-oriented output under `.vercel/output` or Nitro’s Vercel layout (not a Cloudflare worker name / `.wrangler` deploy path).

## Related

- [docs/PRODUCTION.md](./PRODUCTION.md) — broader ops checklist
- Slice 2 (next): apply Supabase migration + seed so Preview uses real data
