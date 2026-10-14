/** Admin-facing copy for amenity catalog and property assignment mutations. */

export function amenityRpcErrorMessage(message: string) {
  if (message.includes("AMENITY_NOT_AUTHORIZED")) return "Not authorized to change amenities.";
  if (message.includes("AMENITY_NOT_FOUND")) return "That property was not found.";
  const invalid = message.indexOf("AMENITY_INVALID:");
  if (invalid >= 0) {
    const detail = message.slice(invalid + "AMENITY_INVALID:".length).trim();
    if (detail && !/sql|postgres|constraint/i.test(detail)) return detail;
  }
  return "Amenity update failed.";
}

export function amenityWriteErrorMessage(message: string) {
  if (message.includes("amenities_label_key") || message.includes("amenities_label_unique")) {
    return "An amenity with this label already exists.";
  }
  return amenityDeleteErrorMessage(message);
}

export function amenityDeleteErrorMessage(message: string) {
  if (
    message.includes("property_amenities_amenity_id_fkey") ||
    (message.includes("foreign key") && message.includes("amenity"))
  ) {
    return "This amenity is still assigned to a property. Unassign it first.";
  }
  return "Amenity update failed.";
}
