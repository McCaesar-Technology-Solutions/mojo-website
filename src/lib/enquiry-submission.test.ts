import assert from "node:assert/strict";
import test from "node:test";
import {
  assertEnquiryStay,
  assertNotSpam,
  enquiryActorId,
  enquiryConfirmation,
  finishSavedEnquiry,
} from "./enquiry-submission.ts";

const row = {
  id: "enq-1",
  property_id: "prop-1",
  user_id: null,
  check_in: "2026-10-13",
  check_out: "2026-10-16",
  guests: 2,
  full_name: "Guest",
  email: "guest@example.test",
  phone: "233000000000",
  notes: "late arrival",
  nightly_rate: 100,
  status: "new",
};

test("anonymous enquiry confirmation omits contact details and price", () => {
  assert.equal(enquiryActorId(null), null);
  const confirmation = enquiryConfirmation({ ...row, user_id: null });
  assert.deepEqual(confirmation, {
    id: "enq-1",
    property_id: "prop-1",
    check_in: "2026-10-13",
    check_out: "2026-10-16",
    guests: 2,
    status: "new",
  });
  const serialized = JSON.stringify(confirmation);
  assert.equal(serialized.includes("guest@example.test"), false);
  assert.equal(serialized.includes("233000000000"), false);
  assert.equal(serialized.includes("late arrival"), false);
  assert.equal(serialized.includes("full_name"), false);
});

test("authenticated enquiry uses the verified user id, not a caller-supplied id", () => {
  const verified = "user-verified";
  assert.equal(enquiryActorId(verified), verified);
  assert.equal(enquiryActorId(undefined), null);
});

test("a mismatched user id cannot be attached by the client payload", () => {
  const verified = "user-verified";
  const claimed = "user-other";
  assert.notEqual(enquiryActorId(verified), claimed);
  assert.equal(Object.hasOwn(enquiryConfirmation({ ...row, user_id: claimed }), "user_id"), false);
});

test("a returned PMS failure still confirms the saved enquiry", async () => {
  const logs: string[] = [];
  const result = await finishSavedEnquiry(
    row,
    async () => ({ ok: false, code: "PMS_ERROR" }),
    (entry) => logs.push(entry.code),
  );
  assert.equal(result.enquiry.id, "enq-1");
  assert.equal(result.enquiry.status, "new");
  assert.deepEqual(logs, ["PMS_ERROR"]);
  assert.equal(JSON.stringify(result).includes("guest@example.test"), false);
});

test("a thrown PMS network error still confirms the saved enquiry", async () => {
  const logs: string[] = [];
  const result = await finishSavedEnquiry(
    row,
    async () => {
      throw new TypeError("fetch failed");
    },
    (entry) => logs.push(`${entry.enquiryId}:${entry.code}`),
  );
  assert.equal(result.enquiry.id, "enq-1");
  assert.deepEqual(logs, ["enq-1:PMS_NETWORK"]);
  assert.equal(JSON.stringify(logs).includes("fetch failed"), false);
  assert.equal(JSON.stringify(result).includes("guest@example.test"), false);
});

test("spam and inverted dates are rejected before insert", () => {
  assert.throws(() => assertNotSpam("http://spam.test"), /Spam detected/);
  assert.throws(() => assertEnquiryStay("2026-10-16", "2026-10-13", 2, 4), /Check-out/);
  assert.throws(() => assertEnquiryStay("2026-10-13", "2026-10-16", 5, 4), /4 guests/);
  assert.doesNotThrow(() => assertEnquiryStay("2026-10-13", "2026-10-16", 2, 4));
});
