# RLS penetration checklist

Run against staging with three clients: anon (no session), guest JWT, admin JWT.

## Anon

- [ ] Can `select` published properties, media, pricing, amenities
- [ ] Cannot `select` draft/archived properties
- [ ] Cannot `insert/update/delete` properties, pricing, availability
- [ ] Can `insert` enquiry (with or without user_id null)
- [ ] Cannot `select` other people's enquiries/bookings
- [ ] Cannot read `audit_logs`

## Guest

- [ ] Can read/update own `profiles` row but cannot set `role = admin`
- [ ] Can read own enquiries/bookings
- [ ] Can manage own wishlist
- [ ] Can insert review only for own completed booking
- [ ] Cannot approve enquiries / call admin RPCs successfully

## Admin

- [ ] Full CRUD on properties, media, pricing, blocks
- [ ] Can approve/decline enquiries via RPC
- [ ] Can read all enquiries/bookings/reviews/audit_logs
- [ ] Storage: can upload to `property-media`; anon can only read

## Cross-tenant

- [ ] Guest A cannot read Guest B enquiry by ID guessing
- [ ] Guest cannot update booking status
- [ ] Service role used only in Edge Functions, not browser
