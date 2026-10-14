/**
 * Ordering for the website/PMS approval boundary.
 *
 * PMS confirm is idempotent for confirmed and pre_arrival reservations.
 * The website decline endpoint cannot undo a confirmed stay, so MOJO
 * approval commits first and PMS confirm is retried afterward.
 * Decline commits on MOJO first so a failed PMS release cannot leave an
 * enquiry that can still be approved.
 */

export type ApprovalPlan = "approve_then_confirm" | "confirm_only" | "closed";
export type DeclinePlan = "decline_then_release" | "release_only" | "closed";

export function planWebsiteApproval(status: string): ApprovalPlan {
  if (status === "approved") return "confirm_only";
  if (status === "declined" || status === "expired") return "closed";
  return "approve_then_confirm";
}

export function planWebsiteDecline(status: string): DeclinePlan {
  if (status === "declined") return "release_only";
  if (status === "approved" || status === "expired") return "closed";
  return "decline_then_release";
}

export function isEnquiryAlreadyApprovedError(message: string) {
  return /enquiry already closed/i.test(message);
}

export function mojoApprovalErrorMessage(message: string) {
  if (/dates unavailable/i.test(message)) return "Those dates are not available.";
  if (/no pricing/i.test(message)) return "This property has no pricing.";
  if (/not authorized/i.test(message)) return "Not authorized to approve this enquiry.";
  if (/not found/i.test(message)) return "Enquiry not found.";
  return "Website approval failed.";
}

export function syncBlockMessage(code: string | undefined) {
  if (!code || code === "UNMAPPED" || code === "UNCONFIGURED") return null;
  if (code === "IN_PROGRESS") return "PMS sync is already running for this enquiry. Try again.";
  if (code === "ROOM_UNAVAILABLE") return "The PMS has no room for those dates.";
  return "PMS sync failed. Nothing was approved. Try again.";
}

/** Null means confirm may be treated as success or an intentional skip. */
export function pmsConfirmFailure(code: string | undefined, skipped?: boolean) {
  if (skipped || !code || code === "NOT_FOUND" || code === "UNCONFIGURED" || code === "UNMAPPED") {
    return null;
  }
  if (code === "INVALID_STATUS") return "reconcile" as const;
  return "retry" as const;
}

export const PMS_CONFIRM_RETRY_MESSAGE =
  "The website booking is saved. PMS confirmation did not finish. Approve again to retry.";

export const PMS_CONFIRM_RECONCILE_MESSAGE =
  "The website booking is saved, but the PMS reservation can no longer be confirmed. Reconcile it on the front desk.";

export const PMS_DECLINE_RETRY_MESSAGE =
  "The enquiry is declined on the website. The PMS hold was not released. Decline again to retry.";

/** Stored on enquiries.pms_sync_error. Sync ignores it once pms_reservation_id is set. */
export const PMS_CONFIRM_PENDING = "confirm_pending";
export const PMS_DECLINE_PENDING = "decline_pending";
