import assert from "node:assert/strict";
import test from "node:test";
import {
  PMS_SYNC_CLAIM_TTL_MS,
  decideEnquirySync,
  describePmsSyncError,
  enquirySyncClaimToken,
} from "./pms-sync-state.ts";

const now = 1_700_000_000_000;

test("fresh row is claimable", () => {
  const decision = decideEnquirySync({ pms_reservation_id: null, pms_sync_error: null }, now);
  assert.equal(decision.action, "claim");
  if (decision.action === "claim") assert.equal(decision.previousError, null);
});

test("existing reservation is not sent again", () => {
  const decision = decideEnquirySync(
    { pms_reservation_id: "11111111-1111-4111-8111-111111111111", pms_sync_error: null },
    now,
  );
  assert.deepEqual(decision, {
    action: "done",
    reservationId: "11111111-1111-4111-8111-111111111111",
  });
});

test("a live claim blocks a second sync", () => {
  const token = enquirySyncClaimToken(now - 1_000, "22222222-2222-4222-8222-222222222222");
  const decision = decideEnquirySync({ pms_reservation_id: null, pms_sync_error: token }, now);
  assert.equal(decision.action, "busy");
});

test("a stale claim can be retried", () => {
  const token = enquirySyncClaimToken(
    now - PMS_SYNC_CLAIM_TTL_MS - 1,
    "33333333-3333-4333-8333-333333333333",
  );
  const decision = decideEnquirySync({ pms_reservation_id: null, pms_sync_error: token }, now);
  assert.equal(decision.action, "claim");
  if (decision.action === "claim") assert.equal(decision.previousError, token);
});

test("PMS timeout error is retryable", () => {
  const decision = decideEnquirySync(
    { pms_reservation_id: null, pms_sync_error: "PMS responded 504" },
    now,
  );
  assert.equal(decision.action, "claim");
  if (decision.action === "claim") {
    assert.equal(decision.previousError, "PMS responded 504");
  }
});

test("orphan marker recovers without another PMS create", () => {
  const id = "44444444-4444-4444-8444-444444444444";
  const decision = decideEnquirySync(
    { pms_reservation_id: null, pms_sync_error: `orphan:${id}` },
    now,
  );
  assert.deepEqual(decision, {
    action: "recover",
    reservationId: id,
    previousError: `orphan:${id}`,
  });
});

test("admin-facing copy hides claim tokens", () => {
  const token = enquirySyncClaimToken(now, "55555555-5555-4555-8555-555555555555");
  assert.equal(describePmsSyncError(token), "PMS sync in progress");
  assert.match(describePmsSyncError("PMS responded 504") ?? "", /504/);
});
