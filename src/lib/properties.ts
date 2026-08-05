import { getSupabaseConfig } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/domain";

type PropertyRow = {
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
  property_media: Property["media"] | null;
  property_amenities:
    | { amenities: { id: string; label: string; icon: string; sort_order: number } | null }[]
    | null;
};

function mapRow(row: PropertyRow): Property {
  const pricing = Array.isArray(row.property_pricing)
    ? (row.property_pricing[0] ?? null)
    : row.property_pricing;
  const amenities =
    row.property_amenities
      ?.map((pa) => pa.amenities)
      .filter(Boolean)
      .sort((a, b) => (a!.sort_order ?? 0) - (b!.sort_order ?? 0)) ?? [];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    status: row.status,
    // Paystack Instant Book deferred — treat as request at the edge
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
    media: (row.property_media ?? []).sort((a, b) => a.sort_order - b.sort_order),
    amenities: amenities as Property["amenities"],
  };
}

const selectShape = `
  *,
  property_pricing (*),
  property_media (*),
  property_amenities ( amenities ( id, label, icon, sort_order ) )
`;

function client(): SupabaseClient {
  const existing = getSupabase();
  if (existing) return existing;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
    },
  });
}

export async function listPublishedProperties(opts?: {
  city?: string;
  featured?: boolean;
  guests?: number;
}): Promise<{ properties: Property[]; source: "supabase" }> {
  const supabase = client();

  let query = supabase.from("properties").select(selectShape).eq("status", "published");
  if (opts?.city) query = query.ilike("city", opts.city);
  if (opts?.featured) query = query.eq("is_featured", true);
  if (opts?.guests) query = query.gte("max_guests", opts.guests);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return { properties: ((data ?? []) as PropertyRow[]).map(mapRow), source: "supabase" };
}

export async function getPropertyBySlug(
  slug: string,
): Promise<{ property: Property | null; source: "supabase" }> {
  const supabase = client();

  const { data, error } = await supabase
    .from("properties")
    .select(selectShape)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return { property: null, source: "supabase" };
  return { property: mapRow(data as PropertyRow), source: "supabase" };
}

export async function getBlockedDates(propertyId: string): Promise<string[]> {
  const supabase = client();

  const { data, error } = await supabase
    .from("availability_blocks")
    .select("start_date, end_date")
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);

  const days: string[] = [];
  for (const block of data ?? []) {
    const start = new Date(block.start_date + "T00:00:00");
    const end = new Date(block.end_date + "T00:00:00");
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
  }
  return days;
}

export function coverUrl(property: Property) {
  const cover = property.media?.find((m) => m.is_cover) ?? property.media?.[0];
  return cover?.url ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
}
