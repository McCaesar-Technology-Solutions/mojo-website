import { randomUUID } from "node:crypto";
import { requireServiceSupabase } from "@/lib/supabase/server";
import { isPmsConfigured, syncEnquiryToPms } from "@/lib/pms";
import {
  decideEnquirySync,
  enquirySyncClaimToken,
  enquirySyncOrphanMarker,
} from "@/lib/pms-sync-state";

const ENQUIRY_COLUMNS =
  "id, property_id, check_in, check_out, guests, full_name, email, phone, notes, pms_reservation_id, pms_sync_error";

type EnquirySyncRow = {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  full_name: string;
  email: string;
  phone: string;
  notes: string | null;
  pms_reservation_id: string | null;
  pms_sync_error: string | null;
};

export type EnquirySyncResult =
  | { ok: true; reservationId: string; reused: boolean }
  | { ok: false; skipped: true; code: "UNCONFIGURED" }
  | { ok: false; code: "IN_PROGRESS"; error: string }
  | { ok: false; code: string; error: string };

function logSyncFailure(enquiryId: string, code: string, error: string) {
  console.error(
    JSON.stringify({
      level: "error",
      event: "pms.enquiry_sync",
      enquiryId,
      code,
      error,
    }),
  );
}

async function writeAudit(
  enquiryId: string,
  actorId: string | null,
  meta: Record<string, unknown>,
) {
  const supabase = requireServiceSupabase();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action: "enquiry.pms_sync",
    entity_type: "enquiry",
    entity_id: enquiryId,
    meta,
  });
  if (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "pms.enquiry_sync.audit",
        enquiryId,
        error: error.message,
      }),
    );
  }
}

/**
 * Authoritative website → PMS enquiry sync.
 * Not a server function. Callers must already have established trust
 * (the insert handler that created this row, or a verified admin).
 *
 * Duplicate protection is a compare-and-swap on pms_sync_error.
 * POST /api/website/enquiries idempotency is UNVERIFIED, so a lost
 * reservation id is stored as orphan:<uuid> and retried without a second POST.
 */
export async function syncEnquiryRecord(
  enquiryId: string,
  actorId: string | null = null,
): Promise<EnquirySyncResult> {
  if (!isPmsConfigured()) {
    return { ok: false, skipped: true, code: "UNCONFIGURED" };
  }

  const supabase = requireServiceSupabase();
  const { data, error } = await supabase
    .from("enquiries")
    .select(ENQUIRY_COLUMNS)
    .eq("id", enquiryId)
    .maybeSingle();

  if (error || !data) {
    const message = error?.message ?? "Enquiry not found.";
    logSyncFailure(enquiryId, "NOT_FOUND", message);
    return { ok: false, code: "NOT_FOUND", error: "Enquiry not found." };
  }

  const row = data as EnquirySyncRow;
  const decision = decideEnquirySync(row, Date.now());

  if (decision.action === "done") {
    return { ok: true, reservationId: decision.reservationId, reused: true };
  }

  if (decision.action === "busy") {
    return {
      ok: false,
      code: "IN_PROGRESS",
      error: "PMS sync is already running for this enquiry.",
    };
  }

  if (decision.action === "recover") {
    const recovered = await persistReservation(
      enquiryId,
      decision.reservationId,
      decision.previousError,
    );
    if (!recovered.ok) {
      logSyncFailure(enquiryId, recovered.code, recovered.error);
      await writeAudit(enquiryId, actorId, { ok: false, code: recovered.code });
    }
    return recovered.ok
      ? { ok: true, reservationId: decision.reservationId, reused: true }
      : recovered;
  }

  const token = enquirySyncClaimToken(Date.now(), randomUUID());
  let claim = supabase
    .from("enquiries")
    .update({ pms_sync_error: token })
    .eq("id", enquiryId)
    .is("pms_reservation_id", null);
  claim =
    decision.previousError === null
      ? claim.is("pms_sync_error", null)
      : claim.eq("pms_sync_error", decision.previousError);

  const { data: claimed, error: claimError } = await claim.select("id").maybeSingle();
  if (claimError) {
    logSyncFailure(enquiryId, "CLAIM_FAILED", claimError.message);
    return { ok: false, code: "CLAIM_FAILED", error: "Could not start PMS sync." };
  }
  if (!claimed) {
    return {
      ok: false,
      code: "IN_PROGRESS",
      error: "PMS sync is already running for this enquiry.",
    };
  }

  const result = await syncEnquiryToPms({
    enquiryId: row.id,
    propertyId: row.property_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
  });

  if (!result.ok || !result.reservationId) {
    const message = !result.ok ? result.error : "PMS did not return a reservation id.";
    const code = !result.ok ? result.code : "PMS_ERROR";
    await supabase
      .from("enquiries")
      .update({ pms_sync_error: message })
      .eq("id", enquiryId)
      .eq("pms_sync_error", token);
    logSyncFailure(enquiryId, code, message);
    await writeAudit(enquiryId, actorId, { ok: false, code });
    return { ok: false, code, error: message };
  }

  const persisted = await persistReservation(enquiryId, result.reservationId, token);
  if (!persisted.ok) {
    const marker = enquirySyncOrphanMarker(result.reservationId);
    const { error: orphanError } = await supabase
      .from("enquiries")
      .update({ pms_sync_error: marker })
      .eq("id", enquiryId)
      .eq("pms_sync_error", token)
      .is("pms_reservation_id", null);
    logSyncFailure(enquiryId, "WRITE_FAILED", orphanError?.message ?? persisted.error);
    await writeAudit(enquiryId, actorId, {
      ok: false,
      code: "WRITE_FAILED",
      reservationId: result.reservationId,
    });
    if (orphanError) {
      return {
        ok: false,
        code: "WRITE_FAILED",
        error:
          "PMS reservation was created but could not be saved. Retry before the sync claim expires.",
      };
    }
    const recovered = await persistReservation(enquiryId, result.reservationId, marker);
    if (!recovered.ok) return recovered;
  }

  await writeAudit(enquiryId, actorId, {
    ok: true,
    reservationId: result.reservationId,
    reused: result.reused,
  });

  return {
    ok: true,
    reservationId: result.reservationId,
    reused: Boolean(result.reused),
  };
}

async function persistReservation(
  enquiryId: string,
  reservationId: string,
  expectedError: string,
): Promise<{ ok: true } | { ok: false; code: string; error: string }> {
  const supabase = requireServiceSupabase();
  const { data, error } = await supabase
    .from("enquiries")
    .update({ pms_reservation_id: reservationId, pms_sync_error: null })
    .eq("id", enquiryId)
    .eq("pms_sync_error", expectedError)
    .is("pms_reservation_id", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      code: "WRITE_FAILED",
      error: error?.message ?? "Could not store the PMS reservation id.",
    };
  }
  return { ok: true };
}
