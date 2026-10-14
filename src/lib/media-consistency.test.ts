import assert from "node:assert/strict";
import test from "node:test";
import {
  MediaPersistError,
  PROPERTY_STORAGE_PARTIAL,
  STORAGE_DELETE_PARTIAL,
  mediaRpcErrorMessage,
  shouldDeleteUploadedObject,
} from "./media-consistency.ts";

test("cover and order errors stay specific", () => {
  assert.equal(
    mediaRpcErrorMessage("MEDIA_NOT_FOUND"),
    "That photo was not found on this property.",
  );
  assert.equal(mediaRpcErrorMessage("MEDIA_INVALID: duplicate photo ids"), "duplicate photo ids");
  assert.equal(
    mediaRpcErrorMessage("MEDIA_INVALID: the order must include every photo for this property"),
    "the order must include every photo for this property",
  );
  assert.match(
    mediaRpcErrorMessage(
      'duplicate key value violates unique constraint "property_media_one_cover_idx"',
    ),
    /cover photo/,
  );
});

test("raw database errors are not shown", () => {
  assert.equal(
    mediaRpcErrorMessage('null value in column "url" violates not-null constraint'),
    "Media update failed.",
  );
});

test("a failed insert cleans up the uploaded object, a saved row does not", () => {
  assert.equal(shouldDeleteUploadedObject(new MediaPersistError("insert failed", false)), true);
  assert.equal(shouldDeleteUploadedObject(new MediaPersistError("audit failed", true)), false);
  assert.equal(shouldDeleteUploadedObject(new Error("storage upload failed")), false);
});

test("partial storage failures are explicit", () => {
  assert.match(STORAGE_DELETE_PARTIAL, /still in storage/);
  assert.match(PROPERTY_STORAGE_PARTIAL, /still in storage/);
});
