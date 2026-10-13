/** Safe messages for failed reads. Never return Postgres text to the UI. */

export const READ_FAILED = "Something went wrong. Please try again.";
export const AUDIT_PARTIAL = "The change was saved, but the audit record failed.";
export const REFUND_RECONCILE =
  "Paystack accepted the refund, but the booking could not be updated. Reconcile it before retrying.";

export function publicReadError(): Error {
  return new Error(READ_FAILED);
}

export function queryFailed(error: { message?: string } | null | undefined): boolean {
  return Boolean(error);
}

/** Dashboard numbers are only valid when every count query succeeded. */
export function dashboardCountsOrThrow(results: Array<{ error: { message?: string } | null }>) {
  if (results.some((result) => queryFailed(result.error))) {
    throw publicReadError();
  }
}
