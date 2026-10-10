# Paystack refund recovery

This procedure is for a booking whose `paystack_refund_state` is `provider_pending`. That state means a refund request was started and its result was not saved. The app will not send another Paystack refund while the booking stays in that state.

Paystack is not queried by the recovery action. The operator has to read the Paystack dashboard.

## Operator checks

1. Open the Paystack dashboard and find the charge by the booking's `paystack_reference`.
2. Record the reference exactly as shown, plus a note of the refund id, amount, and time, or a note that no completed refund is shown.
3. In Admin → Audit, on the unresolved late-payment row, choose **Record a dashboard check**.
4. If the dashboard shows the refund succeeded, choose that option, enter the matching reference and the note, then submit. The server stores the admin id, time, reference, and note, marks the refund accepted, and runs `finalize_paystack_refund`. That releases occupancy and clears the late-payment row only if finalization commits.
5. If the dashboard does not show a completed refund, choose unknown. The server stores the same audit trail and leaves `provider_pending`. No Paystack refund is sent.
6. If acceptance was saved but finalization failed, the booking stays `provider_accepted`. Use **Refund and release calendar**. That retries local cleanup only.

A click without a reference and a verification note is rejected. A reference that does not match the booking is rejected.

## Rollback

`20261007130400_manual_refund_verification.sql` only adds `record_manual_refund_verification`. Roll it back with:

```sql
drop function if exists public.record_manual_refund_verification(uuid, uuid, text, text, text);
```

`20261007130300_refund_recovery_and_hold_cancel.sql` adds `paystack_refund_state`, `paystack_checkout_state`, and two unique audit indexes, and replaces booking and payment functions. Rolling that back means restoring the previous function bodies from `20261007130000`, `20261007130100`, and `20261007130200`, then dropping the two columns and the indexes `audit_logs_one_payment_after_cancel` and `audit_logs_one_unmatched_payment`. Drop `record_manual_refund_verification` first. Do not drop the columns while any deployed function still reads them.
