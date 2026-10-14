/** Maps admin_update_booking RPC failures to safe client messages. */

export type BookingMutationFailure =
  "unauthorized" | "not_found" | "invalid" | "unavailable" | "corrupt" | "database";

const INVALID_PREFIX = "BOOKING_INVALID:";

export function classifyBookingMutationError(error: {
  message?: string | null;
  code?: string | null;
}): BookingMutationFailure {
  const message = error.message ?? "";
  if (message.includes("BOOKING_NOT_AUTHORIZED") || error.code === "42501") {
    return "unauthorized";
  }
  if (message.includes("BOOKING_NOT_FOUND")) return "not_found";
  if (message.includes("BOOKING_DATES_UNAVAILABLE") || error.code === "23P01") {
    return "unavailable";
  }
  if (message.includes("BOOKING_BLOCK_CORRUPT")) return "corrupt";
  if (message.includes("BOOKING_INVALID") || error.code === "22023") return "invalid";
  return "database";
}

export function bookingMutationErrorMessage(error: {
  message?: string | null;
  code?: string | null;
}): string {
  const kind = classifyBookingMutationError(error);
  if (kind === "unauthorized") return "Not authorized to update this booking.";
  if (kind === "not_found") return "Booking not found.";
  if (kind === "unavailable") return "Those dates are not available.";
  if (kind === "corrupt") {
    return "This booking's calendar block does not match the stay. Reconcile it before changing the booking.";
  }
  if (kind === "invalid") {
    const message = error.message ?? "";
    const index = message.indexOf(INVALID_PREFIX);
    if (index >= 0) {
      const detail = message.slice(index + INVALID_PREFIX.length).trim();
      if (detail && !/sql|postgres|constraint/i.test(detail)) return detail;
    }
    return "That booking update is not allowed.";
  }
  return "Booking update failed.";
}
