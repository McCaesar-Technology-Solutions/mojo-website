/** Claim lifetime while a sync is in flight. A dead worker can be retried after this. */
export const PMS_SYNC_CLAIM_TTL_MS = 120_000;

const CLAIM_RE = /^claim:(\d+):([0-9a-f-]{36})$/i;
const ORPHAN_RE = /^orphan:([0-9a-f-]{36})$/i;

export type EnquirySyncSnapshot = {
  pms_reservation_id: string | null;
  pms_sync_error: string | null;
};

export type EnquirySyncDecision =
  | { action: "done"; reservationId: string }
  | { action: "busy" }
  | { action: "recover"; reservationId: string; previousError: string }
  | { action: "claim"; previousError: string | null };

export function enquirySyncClaimToken(now: number, nonce: string) {
  return `claim:${now}:${nonce}`;
}

export function enquirySyncOrphanMarker(reservationId: string) {
  return `orphan:${reservationId}`;
}

export function describePmsSyncError(error: string | null | undefined) {
  if (!error) return null;
  if (CLAIM_RE.test(error)) return "PMS sync in progress";
  const orphan = ORPHAN_RE.exec(error);
  if (orphan) return `PMS stay saved (${orphan[1].slice(0, 8)}); website link pending retry`;
  if (error === "confirm_pending") {
    return "Website booking is saved. PMS confirmation still needs a retry.";
  }
  if (error === "decline_pending") {
    return "Enquiry is declined. The PMS hold still needs to be released.";
  }
  return error;
}

/**
 * Decide the next sync step from the current row.
 * PMS POST idempotency is not assumed; "recover" must not call PMS again.
 */
export function decideEnquirySync(row: EnquirySyncSnapshot, now: number): EnquirySyncDecision {
  if (row.pms_reservation_id) {
    return { action: "done", reservationId: row.pms_reservation_id };
  }

  const error = row.pms_sync_error;
  const orphan = error ? ORPHAN_RE.exec(error) : null;
  if (orphan) {
    return { action: "recover", reservationId: orphan[1], previousError: error! };
  }

  const claim = error ? CLAIM_RE.exec(error) : null;
  if (claim) {
    const started = Number(claim[1]);
    if (Number.isFinite(started) && now - started < PMS_SYNC_CLAIM_TTL_MS) {
      return { action: "busy" };
    }
  }

  return { action: "claim", previousError: error };
}
