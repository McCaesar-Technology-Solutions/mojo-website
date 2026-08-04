# MOJO production runbooks

## Approve enquiry

1. Sign in as admin → `/admin/enquiries`
2. Open the enquiry → **Approve**
3. RPC `approve_enquiry` creates a `bookings` row and an `availability_blocks` row (`reason=booked`)
4. Confirm guest email/WhatsApp follow-up

If approve fails with "dates unavailable", inspect `/admin/calendar` for overlaps.

## Refund (Paystack Instant Book)

1. `/admin/bookings` → find paid booking with `paystack_reference`
2. Click **Refund via Paystack** (calls `paystack-refund` Edge Function)
3. Booking status → `refunded`; availability block removed
4. Confirm funds in Paystack dashboard

Partial refunds: invoke function with `amount` in pesewas.

## Unblock calendar

1. `/admin/calendar` → identify block
2. In Supabase SQL (or add delete UI later):  
   `delete from availability_blocks where id = '<id>';`
3. Never delete a `booked` block without also cancelling/refunding the booking

## Compromised admin

1. Supabase Auth → ban/disable the user
2. Rotate Supabase service role + anon keys if leaked
3. Rotate Paystack secret keys
4. Review `audit_logs` for actions after compromise time
5. Reset password / force re-login for remaining admins

## Webhook replay (Paystack)

1. Paystack Dashboard → Webhooks → replay `charge.success`
2. Function `paystack-webhook` is idempotent on reference
3. Confirm booking status `confirmed` and hold converted to `booked`

## Secrets rotation

Rotate in this order: Paystack secret → Supabase service role → Resend API → update Edge Function secrets → redeploy functions → update staging/prod app env → verify Instant Book test charge.

## Soft launch

1. Publish 1–2 real properties only
2. Keep most inventory on `request` mode
3. Enable Instant Book on one suite after a successful test payment
4. Watch enquiry inbox + Paystack webhooks for 48h

## Backups / PITR

Enable Point-in-Time Recovery on the production Supabase project. Weekly verify: restore staging from backup and run `npm run build` + smoke enquiry.

## Guest data export / delete

- Export: SQL select from `profiles`, `enquiries`, `bookings`, `wishlists`, `messages` by `user_id` / email
- Delete: delete auth user (cascades profile); anonymize booking guest fields if accounting retention requires keeping the row
