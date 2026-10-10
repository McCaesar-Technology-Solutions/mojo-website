import { requireAdminClient } from "@/lib/admin";

export type ManualRefundOutcome = "accepted" | "unknown";

/** Admin-only. Paystack is called by the paystack-refund edge function, not the browser. */
export async function adminReconcileLatePayment(bookingId: string) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase.functions.invoke("paystack-refund", {
    body: { booking_id: bookingId },
  });
  const payload = data as { ok?: boolean; error?: string } | null;
  if (payload?.error) throw new Error(payload.error);
  if (error) {
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    const body = context?.json ? await context.json().catch(() => null) : null;
    throw new Error(body?.error ?? "The refund was not completed. The late-payment row is still open.");
  }
  if (payload?.ok !== true) {
    throw new Error("The refund was not completed. The late-payment row is still open.");
  }
  return payload;
}

/** Records an externally checked refund. Does not call Paystack. */
export async function adminRecordRefundVerification(input: {
  bookingId: string;
  outcome: ManualRefundOutcome;
  reference: string;
  evidence: string;
}) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase.functions.invoke("paystack-refund-reconcile", {
    body: {
      booking_id: input.bookingId,
      outcome: input.outcome,
      reference: input.reference,
      evidence: input.evidence,
    },
  });
  const payload = data as { ok?: boolean; error?: string; outcome?: string; occupancyReleased?: boolean } | null;
  if (payload?.error) throw new Error(payload.error);
  if (error) {
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    const body = context?.json ? await context.json().catch(() => null) : null;
    throw new Error(body?.error ?? "The verification was not recorded.");
  }
  if (payload?.ok !== true) throw new Error("The verification was not recorded.");
  return payload;
}
