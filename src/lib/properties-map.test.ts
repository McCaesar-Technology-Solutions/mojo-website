import assert from "node:assert/strict";
import test from "node:test";
import { mapRow } from "./property-row.ts";

const base = {
  id: "p1",
  slug: "stay",
  title: "Stay",
  type: "Apartment" as const,
  status: "published" as const,
  booking_mode: "request" as const,
  city: "Accra",
  area: null,
  country: "Ghana",
  description: null,
  bedrooms: 1,
  bathrooms: 1,
  max_guests: 2,
  size_sqm: null,
  rating: 4.5,
  review_count: 3,
  is_featured: true,
  check_in_time: "14:00",
  check_out_time: "11:00",
  house_rules: ["Quiet hours"],
  policies: [{ title: "Cancel", detail: "Flexible", icon: "x" }],
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

test("mapRow accepts media and pricing as a single object", () => {
  const property = mapRow({
    ...base,
    property_pricing: {
      id: "pr",
      property_id: "p1",
      nightly_rate: 900,
      original_nightly_rate: null,
      cleaning_fee: 0,
      service_fee_rate: 0.04,
      currency: "GHS",
      discount_label: null,
    },
    property_media: {
      id: "m1",
      property_id: "p1",
      url: "https://example.com/cover.jpg",
      storage_path: null,
      sort_order: 0,
      is_cover: true,
      alt: null,
    },
    property_amenities: [
      { amenities: { id: "a1", label: "Wifi", icon: "wifi", sort_order: 2 } },
      { amenities: null },
    ],
  });

  assert.equal(property.pricing?.nightly_rate, 900);
  assert.equal(property.media.length, 1);
  assert.equal(property.amenities.length, 1);
  assert.equal(property.amenities[0]?.label, "Wifi");
  assert.equal(property.booking_mode, "request");
});

test("mapRow treats missing nested relations as empty", () => {
  const property = mapRow({
    ...base,
    property_pricing: null,
    property_media: null,
    property_amenities: null,
  });
  assert.equal(property.pricing, null);
  assert.deepEqual(property.media, []);
  assert.deepEqual(property.amenities, []);
});
