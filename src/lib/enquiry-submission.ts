/**
 * Request-to-Book submission rules.
 * Inventory locks stay on approve_enquiry. This path only creates an enquiry.
 */

export type EnquiryConfirmation = {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
};

const CONFIRMATION_KEYS = [
  "id",
  "property_id",
  "check_in",
  "check_out",
  "guests",
  "status",
] as const;

export function enquiryActorId(verifiedUserId: string | null | undefined): string | null {
  return verifiedUserId ?? null;
}

export function assertEnquiryStay(
  checkIn: string,
  checkOut: string,
  guests: number,
  maxGuests: number,
) {
  if (checkOut <= checkIn) {
    throw new Error("Check-out must be after check-in");
  }
  if (guests > maxGuests) {
    throw new Error(`This stay allows up to ${maxGuests} guests`);
  }
}

export function assertNotSpam(website: string | undefined) {
  if (website) throw new Error("Spam detected");
}

type SyncOutcome = { ok: boolean; skipped?: boolean; code?: string };

/**
 * The enquiry row is already stored. PMS sync is optional.
 * A thrown network error or an unsuccessful response must not fail the guest request.
 */
export async function finishSavedEnquiry(
  row: Record<string, unknown>,
  sync: () => Promise<SyncOutcome>,
  log: (entry: { enquiryId: string; code: string }) => void,
): Promise<{ enquiry: EnquiryConfirmation }> {
  const enquiry = enquiryConfirmation(row);
  try {
    const synced = await sync();
    if (!synced.ok && !synced.skipped) {
      log({ enquiryId: enquiry.id, code: synced.code ?? "PMS_ERROR" });
    }
  } catch {
    log({ enquiryId: enquiry.id, code: "PMS_NETWORK" });
  }
  return { enquiry };
}

export function enquiryConfirmation(row: Record<string, unknown>): EnquiryConfirmation {
  const confirmation = {} as EnquiryConfirmation;
  for (const key of CONFIRMATION_KEYS) {
    confirmation[key] = row[key] as never;
  }
  return confirmation;
}
