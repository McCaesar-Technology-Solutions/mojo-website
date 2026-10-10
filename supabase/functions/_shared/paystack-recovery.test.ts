import assert from "node:assert/strict";
import test from "node:test";
import {
  parseManualRefundVerification,
  preserveCheckout,
  refundRetryCallsProvider,
} from "./paystack-recovery.ts";

test("checkout is preserved when Paystack may have accepted the charge", () => {
  assert.equal(preserveCheckout("unknown"), true);
  assert.equal(preserveCheckout("accepted"), true);
  assert.equal(preserveCheckout("rejected"), false);
  assert.equal(preserveCheckout("not_called"), false);
});

test("a refund retry calls Paystack only for a fresh claim", () => {
  assert.equal(refundRetryCallsProvider("call_provider"), true);
  assert.equal(refundRetryCallsProvider("reconcile"), false);
  assert.equal(refundRetryCallsProvider("unknown"), false);
});

test("manual verification requires an explicit outcome, reference, and note", () => {
  assert.equal(parseManualRefundVerification({ outcome: undefined, reference: "mojo_a", evidence: "seen in dashboard" }).ok, false);
  assert.equal(parseManualRefundVerification({ outcome: "accepted", reference: " ", evidence: "short" }).ok, false);
  const unknown = parseManualRefundVerification({
    outcome: "unknown",
    reference: " mojo_a ",
    evidence: "  dashboard shows no refund ",
  });
  assert.deepEqual(unknown, {
    ok: true,
    outcome: "unknown",
    reference: "mojo_a",
    evidence: "dashboard shows no refund",
  });
  const accepted = parseManualRefundVerification({
    outcome: "accepted",
    reference: "mojo_a",
    evidence: "Paystack refund id RF_123 succeeded",
  });
  assert.equal(accepted.ok, true);
});
