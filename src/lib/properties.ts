import { getSupabaseConfig } from "@/lib/env";
import { mapRow, type PropertyRow } from "@/lib/property-row";
import { publicReadError } from "@/lib/read-error";
import { getSupabase } from "@/lib/supabase/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/domain";

export { mapRow } from "@/lib/property-row";

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
  if (error) {
    if (import.meta.env.DEV) console.error("[listPublishedProperties]", error.message);
    throw publicReadError();
  }

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

  if (error) {
    if (import.meta.env.DEV) console.error("[getPropertyBySlug]", error.message);
    throw publicReadError();
  }
  if (!data) return { property: null, source: "supabase" };
  return { property: mapRow(data as PropertyRow), source: "supabase" };
}

export async function getBlockedDates(propertyId: string): Promise<string[]> {
  const supabase = client();

  const { data, error } = await supabase
    .from("availability_blocks")
    .select("start_date, end_date")
    .eq("property_id", propertyId);

  if (error) throw publicReadError();

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
