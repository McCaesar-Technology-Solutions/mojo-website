/** Local recovery decisions. Paystack refund idempotency is not assumed. */

export type CheckoutOutcome = "not_called" | "rejected" | "unknown" | "accepted";

export type RefundAction = "call_provider" | "reconcile" | "unknown";

/** Keep the booking and hold when Paystack may already have created a charge. */
export function preserveCheckout(outcome: CheckoutOutcome): boolean {
  return outcome === "unknown" || outcome === "accepted";
}

/** Only an explicit claim of call_provider may send a new refund. */
export function refundRetryCallsProvider(action: RefundAction): boolean {
  return action === "call_provider";
}

export type ManualRefundOutcome = "accepted" | "unknown";

/** Rejects a bare confirmation. Accepted is not the default. */
export function parseManualRefundVerification(input: {
  outcome: unknown;
  reference: unknown;
  evidence: unknown;
}):
  | { ok: true; outcome: ManualRefundOutcome; reference: string; evidence: string }
  | { ok: false; error: string } {
  if (input.outcome !== "accepted" && input.outcome !== "unknown") {
    return { ok: false, error: "Record whether the Paystack dashboard shows the refund as accepted or still unknown." };
  }
  const reference = typeof input.reference === "string" ? input.reference.trim() : "";
  const evidence = typeof input.evidence === "string" ? input.evidence.trim() : "";
  if (!reference || evidence.length < 8) {
    return {
      ok: false,
      error: "Enter the Paystack reference you checked and a note of at least 8 characters describing what you saw.",
    };
  }
  return { ok: true, outcome: input.outcome, reference, evidence };
}
