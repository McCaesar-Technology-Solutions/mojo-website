# Staging seed reset

1. Reset staging DB (Supabase dashboard → Database → Reset, or `supabase db reset` locally)
2. `npx supabase db push` (applies migrations)
3. Run `supabase/seed.sql`
4. Create a test guest + admin user via Auth signup
5. Promote admin:
   `update public.profiles set role = 'admin' where id = '<uuid>';`
6. Smoke: publish property, enquiry, approve, Instant Book test charge
