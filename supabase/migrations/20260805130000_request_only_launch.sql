-- Launch posture: Request to Book only (Paystack Instant Book deferred)
update public.properties set booking_mode = 'request' where booking_mode = 'instant';
