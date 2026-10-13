import assert from "node:assert/strict";
import test from "node:test";
import { READ_FAILED, dashboardCountsOrThrow, publicReadError, queryFailed } from "./read-error.ts";

test("a database error is not an empty result", () => {
  assert.equal(queryFailed({ message: 'relation "profiles" does not exist' }), true);
  assert.equal(queryFailed(null), false);
  assert.equal(publicReadError().message, READ_FAILED);
  assert.equal(publicReadError().message.includes("relation"), false);
});

test("dashboard stats fail when any query fails", () => {
  assert.throws(
    () => dashboardCountsOrThrow([{ error: null }, { error: { message: "timeout" } }]),
    (error: unknown) => error instanceof Error && error.message === READ_FAILED,
  );
  assert.doesNotThrow(() => dashboardCountsOrThrow([{ error: null }, { error: null }]));
});
