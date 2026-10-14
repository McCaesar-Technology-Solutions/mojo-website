import type { Property } from "../types/domain";

export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  type: Property["type"];
  status: Property["status"];
  booking_mode: Property["booking_mode"];
  city: string;
  area: string | null;
  country: string;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  size_sqm: number | null;
  rating: number | null;
  review_count: number;
  is_featured: boolean;
  check_in_time: string;
  check_out_time: string;
  house_rules: string[] | null;
  policies: Property["policies"] | null;
  created_at: string;
  updated_at: string;
  property_pricing: Property["pricing"] | Property["pricing"][] | null;
  property_media: Property["media"] | NonNullable<Property["media"]>[number] | null;
  property_amenities:
    { amenities: { id: string; label: string; icon: string; sort_order: number } | null }[] | null;
};

function asList<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function mapRow(row: PropertyRow): Property {
  const pricing = Array.isArray(row.property_pricing)
    ? (row.property_pricing[0] ?? null)
    : row.property_pricing;
  const amenities = asList(row.property_amenities)
    .map((pa) => pa.amenities)
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    status: row.status,
    booking_mode: "request",
    city: row.city,
    area: row.area,
    country: row.country,
    description: row.description,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    max_guests: row.max_guests,
    size_sqm: row.size_sqm,
    rating: row.rating,
    review_count: row.review_count,
    is_featured: row.is_featured,
    check_in_time: row.check_in_time,
    check_out_time: row.check_out_time,
    house_rules: row.house_rules ?? [],
    policies: row.policies ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    pricing: pricing ?? null,
    media: asList(row.property_media).sort((a, b) => a.sort_order - b.sort_order),
    amenities,
  };
}
