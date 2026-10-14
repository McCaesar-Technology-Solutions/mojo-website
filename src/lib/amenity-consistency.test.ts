import assert from "node:assert/strict";
import test from "node:test";
import {
  amenityDeleteErrorMessage,
  amenityRpcErrorMessage,
  amenityWriteErrorMessage,
} from "./amenity-consistency.ts";

test("replacement errors stay specific", () => {
  assert.equal(
    amenityRpcErrorMessage("AMENITY_NOT_AUTHORIZED"),
    "Not authorized to change amenities.",
  );
  assert.equal(amenityRpcErrorMessage("AMENITY_NOT_FOUND"), "That property was not found.");
  assert.equal(
    amenityRpcErrorMessage("AMENITY_INVALID: duplicate amenity ids"),
    "duplicate amenity ids",
  );
  assert.equal(amenityRpcErrorMessage("AMENITY_INVALID: unknown amenity id"), "unknown amenity id");
  assert.equal(
    amenityRpcErrorMessage("AMENITY_INVALID: amenity ids are required"),
    "amenity ids are required",
  );
});

test("raw database errors are not shown", () => {
  assert.equal(
    amenityRpcErrorMessage('null value in column "amenity_id" violates not-null constraint'),
    "Amenity update failed.",
  );
});

test("duplicate amenity labels stay specific", () => {
  assert.equal(
    amenityWriteErrorMessage(
      'duplicate key value violates unique constraint "amenities_label_key"',
    ),
    "An amenity with this label already exists.",
  );
});

test("deleting an amenity that is still assigned stays specific", () => {
  assert.equal(
    amenityDeleteErrorMessage(
      'update or delete on table "amenities" violates foreign key constraint "property_amenities_amenity_id_fkey" on table "property_amenities"',
    ),
    "This amenity is still assigned to a property. Unassign it first.",
  );
});
