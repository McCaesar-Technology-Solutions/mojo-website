import assert from "node:assert/strict";
import test from "node:test";
import { bookingMutationErrorMessage, classifyBookingMutationError } from "./booking-mutation.ts";

test("availability conflicts stay distinct from validation", () => {
  assert.equal(
    classifyBookingMutationError({ message: "BOOKING_DATES_UNAVAILABLE", code: "23P01" }),
    "unavailable",
  );
  assert.equal(
    bookingMutationErrorMessage({ message: "BOOKING_DATES_UNAVAILABLE" }),
    "Those dates are not available.",
  );
});

test("authorization, missing rows, and corrupt blocks are distinct", () => {
  assert.equal(
    classifyBookingMutationError({ message: "BOOKING_NOT_AUTHORIZED", code: "42501" }),
    "unauthorized",
  );
  assert.equal(classifyBookingMutationError({ message: "BOOKING_NOT_FOUND" }), "not_found");
  assert.equal(
    classifyBookingMutationError({ message: "BOOKING_BLOCK_CORRUPT: multiple booked blocks" }),
    "corrupt",
  );
});

test("controlled invalid details are shown and raw database errors are not", () => {
  assert.equal(
    bookingMutationErrorMessage({
      message: "BOOKING_INVALID: status cannot change from completed to cancelled",
    }),
    "status cannot change from completed to cancelled",
  );
  assert.equal(
    bookingMutationErrorMessage({
      message: 'duplicate key value violates unique constraint "bookings_pkey"',
      code: "23505",
    }),
    "Booking update failed.",
  );
});
