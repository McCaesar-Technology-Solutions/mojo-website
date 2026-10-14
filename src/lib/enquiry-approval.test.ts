import assert from "node:assert/strict";
import test from "node:test";
import {
  PMS_CONFIRM_RECONCILE_MESSAGE,
  PMS_CONFIRM_RETRY_MESSAGE,
  isEnquiryAlreadyApprovedError,
  planWebsiteApproval,
  planWebsiteDecline,
  pmsConfirmFailure,
  syncBlockMessage,
} from "./enquiry-approval.ts";

test("open enquiries approve on the website before PMS confirm", () => {
  assert.equal(planWebsiteApproval("new"), "approve_then_confirm");
  assert.equal(planWebsiteApproval("in_review"), "approve_then_confirm");
});

test("an approved enquiry only retries PMS confirm", () => {
  assert.equal(planWebsiteApproval("approved"), "confirm_only");
});

test("declined and expired enquiries are not approved again", () => {
  assert.equal(planWebsiteApproval("declined"), "closed");
  assert.equal(planWebsiteApproval("expired"), "closed");
});

test("decline commits on the website before the PMS release", () => {
  assert.equal(planWebsiteDecline("new"), "decline_then_release");
  assert.equal(planWebsiteDecline("declined"), "release_only");
  assert.equal(planWebsiteDecline("approved"), "closed");
});

test("a lost race against approve_enquiry is recognized", () => {
  assert.equal(isEnquiryAlreadyApprovedError("enquiry already closed"), true);
  assert.equal(isEnquiryAlreadyApprovedError("dates unavailable"), false);
});

test("PMS confirm failures distinguish retry from reconciliation", () => {
  assert.equal(pmsConfirmFailure("NOT_FOUND", true), null);
  assert.equal(pmsConfirmFailure("TRANSITION_FAILED"), "retry");
  assert.equal(pmsConfirmFailure("INVALID_STATUS"), "reconcile");
  assert.equal(PMS_CONFIRM_RETRY_MESSAGE.includes("Approve again"), true);
  assert.equal(PMS_CONFIRM_RECONCILE_MESSAGE.includes("front desk"), true);
});

test("sync failures stay on the website side of approval", () => {
  assert.equal(syncBlockMessage("UNCONFIGURED"), null);
  assert.equal(syncBlockMessage("IN_PROGRESS")?.includes("Try again"), true);
  assert.equal(syncBlockMessage("PMS_ERROR"), "PMS sync failed. Nothing was approved. Try again.");
});
