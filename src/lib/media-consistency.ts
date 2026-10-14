/** Safe admin copy for property media mutations. Storage and Postgres are not one transaction. */

export class MediaPersistError extends Error {
  readonly persisted: boolean;

  constructor(message: string, persisted: boolean) {
    super(message);
    this.name = "MediaPersistError";
    this.persisted = persisted;
  }
}

export function mediaRpcErrorMessage(message: string) {
  if (message.includes("MEDIA_NOT_AUTHORIZED")) return "Not authorized to change property media.";
  if (message.includes("MEDIA_NOT_FOUND")) return "That photo was not found on this property.";
  if (message.includes("property_media_one_cover")) {
    return "This property already has a cover photo.";
  }
  const invalid = message.indexOf("MEDIA_INVALID:");
  if (invalid >= 0) {
    const detail = message.slice(invalid + "MEDIA_INVALID:".length).trim();
    if (detail && !/sql|postgres|constraint/i.test(detail)) return detail;
  }
  return "Media update failed.";
}

export const STORAGE_DELETE_PARTIAL =
  "The photo was removed from the property, but the file is still in storage.";

export const PROPERTY_STORAGE_PARTIAL =
  "The property was deleted, but one or more image files are still in storage.";

export function shouldDeleteUploadedObject(error: unknown) {
  return error instanceof MediaPersistError && !error.persisted;
}
