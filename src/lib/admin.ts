import { getSupabase } from "@/lib/supabase/client";
import type { AuditLog, Booking, Enquiry, Property, PropertyPricing, Review } from "@/types/domain";

type AdminPropertyRow = Omit<Property, "pricing" | "media" | "amenities"> & {
  property_pricing?: PropertyPricing | PropertyPricing[] | null;
};

function normalizePricing(
  raw: PropertyPricing | PropertyPricing[] | null | undefined,
): PropertyPricing | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function mapAdminProperty(row: AdminPropertyRow): Property {
  const { property_pricing: _nested, ...rest } = row;
  return {
    ...rest,
    booking_mode: "request",
    pricing: normalizePricing(row.property_pricing),
  };
}

/** Writable `properties` columns only — never nested joins or client-only fields. */
function propertyWritePayload(
  input: Partial<Property> & { title: string; slug: string; city: string; type: Property["type"] },
  mode: "create" | "update",
) {
  const base = {
    slug: input.slug,
    title: input.title,
    type: input.type,
    status: input.status ?? "draft",
    booking_mode: "request" as const,
    city: input.city,
    area: input.area ?? null,
    description: input.description ?? null,
    max_guests: input.max_guests ?? 2,
    is_featured: Boolean(input.is_featured),
  };

  if (mode === "create") {
    return {
      ...base,
      country: input.country ?? "Ghana",
      bedrooms: input.bedrooms ?? 1,
      bathrooms: input.bathrooms ?? 1,
      size_sqm: input.size_sqm ?? null,
      check_in_time: input.check_in_time ?? "15:00",
      check_out_time: input.check_out_time ?? "11:00",
      house_rules: input.house_rules ?? [],
      policies: input.policies ?? [],
    };
  }

  // Update: do not default-wipe columns the form does not edit yet
  return {
    ...base,
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.bedrooms !== undefined ? { bedrooms: input.bedrooms } : {}),
    ...(input.bathrooms !== undefined ? { bathrooms: input.bathrooms } : {}),
    ...(input.size_sqm !== undefined ? { size_sqm: input.size_sqm } : {}),
    ...(input.check_in_time !== undefined ? { check_in_time: input.check_in_time } : {}),
    ...(input.check_out_time !== undefined ? { check_out_time: input.check_out_time } : {}),
    ...(input.house_rules !== undefined ? { house_rules: input.house_rules } : {}),
    ...(input.policies !== undefined ? { policies: input.policies } : {}),
  };
}

export async function requireAdminClient() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("Admin access required");
  return supabase;
}

export async function adminDashboardStats() {
  const supabase = await requireAdminClient();
  const [props, enquiries, bookings] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("bookings").select("id, total, status, check_in, check_out"),
  ]);
  const bookingRows = (bookings.data ?? []) as Pick<
    Booking,
    "id" | "total" | "status" | "check_in" | "check_out"
  >[];
  const confirmed = bookingRows.filter((b) =>
    ["confirmed", "checked_in", "completed"].includes(b.status),
  );
  const revenue = confirmed.reduce((sum, b) => sum + Number(b.total), 0);
  return {
    publishedProperties: props.count ?? 0,
    newEnquiries: enquiries.count ?? 0,
    bookings: bookingRows.length,
    revenue,
  };
}

export async function adminListProperties() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_pricing(*)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AdminPropertyRow[]).map(mapAdminProperty);
}

export async function adminUpsertProperty(
  input: Partial<Property> & { title: string; slug: string; city: string; type: Property["type"] },
) {
  const supabase = await requireAdminClient();
  const isUpdate = Boolean(input.id);
  const payload = propertyWritePayload(input, isUpdate ? "update" : "create");

  const query = isUpdate
    ? supabase.from("properties").update(payload).eq("id", input.id!).select("*").single()
    : supabase.from("properties").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    action: isUpdate ? "property.updated" : "property.created",
    entity_type: "property",
    entity_id: data.id,
    meta: { slug: data.slug },
  });
  return data as Property;
}

export async function adminSavePricing(
  propertyId: string,
  pricing: {
    nightly_rate: number;
    original_nightly_rate?: number | null;
    cleaning_fee: number;
    service_fee_rate: number;
    discount_label?: string | null;
  },
) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("property_pricing").upsert(
    {
      property_id: propertyId,
      currency: "GHS",
      ...pricing,
    },
    { onConflict: "property_id" },
  );
  if (error) throw error;
}

export async function adminAddMedia(propertyId: string, url: string, isCover = false) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("property_media").insert({
    property_id: propertyId,
    url,
    is_cover: isCover,
    sort_order: 0,
  });
  if (error) throw error;
}

export async function adminListEnquiries() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*, property:properties(title, slug)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Enquiry[];
}

export async function adminApproveEnquiry(id: string, notes?: string) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase.rpc("approve_enquiry", {
    p_enquiry_id: id,
    p_admin_notes: notes ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function adminDeclineEnquiry(id: string, reason: string) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("decline_enquiry", {
    p_enquiry_id: id,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function adminListBookings() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, property:properties(title, slug)")
    .order("check_in", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function adminUpdateBooking(
  id: string,
  patch: Partial<Pick<Booking, "status" | "admin_notes" | "check_in" | "check_out">>,
) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("bookings").update(patch).eq("id", id);
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: "booking.updated",
    entity_type: "booking",
    entity_id: id,
    meta: patch,
  });
}

export async function adminListBlocks(propertyId?: string) {
  const supabase = await requireAdminClient();
  let q = supabase
    .from("availability_blocks")
    .select("*, property:properties(title)")
    .order("start_date");
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateBlock(input: {
  property_id: string;
  start_date: string;
  end_date: string;
  reason: "manual" | "hold";
  notes?: string;
}) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("availability_blocks").insert(input);
  if (error) throw error;
}

export async function adminListGuests() {
  const supabase = await requireAdminClient();
  const { data: profiles } = await supabase.from("profiles").select("*").eq("role", "guest");
  const { data: bookings } = await supabase
    .from("bookings")
    .select("guest_name, guest_email, guest_phone, created_at")
    .order("created_at", { ascending: false });
  return { profiles: profiles ?? [], bookingContacts: bookings ?? [] };
}

export async function adminListReviews() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, property:properties(title)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function adminModerateReview(id: string, status: "approved" | "rejected") {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function adminListAuditLogs() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function adminRefundBooking(bookingId: string, amountPesewas?: number) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase.functions.invoke("paystack-refund", {
    body: { booking_id: bookingId, amount: amountPesewas },
  });
  if (error) throw error;
  return data;
}
