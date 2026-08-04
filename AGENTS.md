<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## MOJO production rules

- Backend is **Supabase** (Auth, Postgres, Storage, Edge Functions). Apply SQL from `supabase/migrations/` before relying on live data.
- **RLS is required** on every user-facing table. Never disable RLS to "just make it work."
- `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are server-only. Never put them in `VITE_*` vars or client bundles.
- Public site falls back to demo catalog in `src/data/demo-properties.ts` when Supabase env is missing — fine for local UI, not for production traffic.
- Admin bootstrap: after first signup, run  
  `update public.profiles set role = 'admin' where id = '<uuid>';`  
  Do not expose an open "sign up as admin" path.
- Booking modes: `request` (enquiry → admin approve) and `instant` (Paystack). Keep both paths working.
- Prefer additive migrations over editing applied migration files.
