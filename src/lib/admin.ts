import { getSupabase } from "@/lib/supabase/client";
import type {
  Amenity,
  AuditLog,
  Booking,
  Enquiry,
  Property,
  PropertyMedia,
  PropertyPricing,
  Review,
} from "@/types/domain";

const MEDIA_BUCKET = "property-media";

type AdminPropertyRow = Omit<Property, "pricing" | "media" | "amenities"> & {
  property_pricing?: PropertyPricing | PropertyPricing[] | null;
  property_media?: PropertyMedia[] | null;
  property_amenities?: { amenities: Amenity | null }[] | null;
};

function normalizePricing(
  raw: PropertyPricing | PropertyPricing[] | null | undefined,
): PropertyPricing | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function mapAdminProperty(row: AdminPropertyRow): Property {
  const {
    property_pricing: _pricing,
    property_media: _media,
    property_amenities: _amenities,
    ...rest
  } = row;
  const amenities =
    row.property_amenities
      ?.map((pa) => pa.amenities)
      .filter((a): a is Amenity => Boolean(a))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? [];

  return {
    ...rest,
    booking_mode: "request",
    pricing: normalizePricing(row.property_pricing),
    media: (row.property_media ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order),
    amenities,
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
    .select(
      "*, property_pricing(*), property_media(*), property_amenities ( amenities ( id, label, icon, sort_order ) )",
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AdminPropertyRow[]).map(mapAdminProperty);
}

export async function adminListAmenities() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("amenities")
    .select("id, label, icon, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Amenity[];
}

export async function adminCreateAmenity(input: {
  label: string;
  icon?: string;
  sort_order?: number;
}) {
  const label = input.label.trim();
  if (!label) throw new Error("Amenity label is required");
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("amenities")
    .insert({
      label,
      icon: input.icon?.trim() || "solar:check-circle-bold",
      sort_order: input.sort_order ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: "amenity.created",
    entity_type: "amenity",
    entity_id: data.id,
    meta: { label: data.label },
  });
  return data as Amenity;
}

export async function adminUpdateAmenity(
  id: string,
  patch: Partial<Pick<Amenity, "label" | "icon" | "sort_order">>,
) {
  const supabase = await requireAdminClient();
  const payload = {
    ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
    ...(patch.icon !== undefined ? { icon: patch.icon.trim() || "solar:check-circle-bold" } : {}),
    ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
  };
  if (payload.label !== undefined && !payload.label) {
    throw new Error("Amenity label is required");
  }
  const { data, error } = await supabase
    .from("amenities")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: "amenity.updated",
    entity_type: "amenity",
    entity_id: id,
    meta: payload,
  });
  return data as Amenity;
}

export async function adminDeleteAmenity(id: string) {
  const supabase = await requireAdminClient();
  const { count, error: countError } = await supabase
    .from("property_amenities")
    .select("property_id", { count: "exact", head: true })
    .eq("amenity_id", id);
  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    throw new Error(
      `This amenity is assigned to ${count} propert${count === 1 ? "y" : "ies"}. Unassign it first.`,
    );
  }
  const { error } = await supabase.from("amenities").delete().eq("id", id);
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: "amenity.deleted",
    entity_type: "amenity",
    entity_id: id,
    meta: {},
  });
}

export async function adminSetPropertyAmenities(propertyId: string, amenityIds: string[]) {
  const supabase = await requireAdminClient();
  const uniqueIds = [...new Set(amenityIds.filter(Boolean))];

  const { error: deleteError } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId);
  if (deleteError) throw deleteError;

  if (uniqueIds.length === 0) return;

  const { error: insertError } = await supabase.from("property_amenities").insert(
    uniqueIds.map((amenity_id) => ({ property_id: propertyId, amenity_id })),
  );
  if (insertError) throw insertError;
}

export async function adminArchiveProperty(id: string) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("properties")
    .update({ status: "archived", booking_mode: "request" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: "property.archived",
    entity_type: "property",
    entity_id: id,
    meta: { slug: data.slug },
  });
  return data as Property;
}

export async function adminDeleteProperty(id: string) {
  const supabase = await requireAdminClient();

  const [enquiries, bookings] = await Promise.all([
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id),
  ]);
  if (enquiries.error) throw enquiries.error;
  if (bookings.error) throw bookings.error;

  const enquiryCount = enquiries.count ?? 0;
  const bookingCount = bookings.count ?? 0;
  if (enquiryCount > 0 || bookingCount > 0) {
    throw new Error(
      `Cannot delete: ${enquiryCount} enquir${enquiryCount === 1 ? "y" : "ies"} and ${bookingCount} booking${bookingCount === 1 ? "" : "s"} still reference this property. Archive it instead.`,
    );
  }

  const media = await adminListPropertyMedia(id);
  const storagePaths = media
    .map((m) => m.storage_path)
    .filter((p): p is string => Boolean(p));

  const { data: property, error: loadError } = await supabase
    .from("properties")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw loadError;

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;

  if (storagePaths.length > 0) {
    await supabase.storage.from(MEDIA_BUCKET).remove(storagePaths);
  }

  await supabase.from("audit_logs").insert({
    action: "property.deleted",
    entity_type: "property",
    entity_id: id,
    meta: { slug: property?.slug ?? null },
  });
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

export async function adminAddMedia(
  propertyId: string,
  url: string,
  options: { isCover?: boolean; alt?: string | null; storagePath?: string | null } = {},
) {
  const supabase = await requireAdminClient();
  const trimmedUrl = url.trim();
  if (!trimmedUrl) throw new Error("Media URL is required");

  const { data: existing, error: listError } = await supabase
    .from("property_media")
    .select("id, sort_order, is_cover")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });
  if (listError) throw listError;

  const rows = existing ?? [];
  const nextOrder =
    rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sort_order)) + 1;
  const makeCover = Boolean(options.isCover) || rows.length === 0;

  if (makeCover && rows.some((r) => r.is_cover)) {
    const { error: clearError } = await supabase
      .from("property_media")
      .update({ is_cover: false })
      .eq("property_id", propertyId);
    if (clearError) throw clearError;
  }

  const { data, error } = await supabase
    .from("property_media")
    .insert({
      property_id: propertyId,
      url: trimmedUrl,
      storage_path: options.storagePath ?? null,
      is_cover: makeCover,
      sort_order: nextOrder,
      alt: options.alt ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PropertyMedia;
}

export async function adminListPropertyMedia(propertyId: string) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("property_media")
    .select("*")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PropertyMedia[];
}

export async function adminUploadMedia(propertyId: string, file: File, alt?: string | null) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5MB or smaller");
  }

  const supabase = await requireAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
  const storagePath = `${propertyId}/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return adminAddMedia(propertyId, publicData.publicUrl, {
    storagePath,
    alt: alt ?? null,
  });
}

export async function adminSetMediaCover(propertyId: string, mediaId: string) {
  const supabase = await requireAdminClient();
  const { error: clearError } = await supabase
    .from("property_media")
    .update({ is_cover: false })
    .eq("property_id", propertyId);
  if (clearError) throw clearError;

  const { error } = await supabase
    .from("property_media")
    .update({ is_cover: true })
    .eq("id", mediaId)
    .eq("property_id", propertyId);
  if (error) throw error;
}

export async function adminUpdateMediaAlt(mediaId: string, alt: string | null) {
  const supabase = await requireAdminClient();
  const { error } = await supabase
    .from("property_media")
    .update({ alt: alt?.trim() || null })
    .eq("id", mediaId);
  if (error) throw error;
}

export async function adminReorderMedia(propertyId: string, orderedIds: string[]) {
  const supabase = await requireAdminClient();
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from("property_media")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("property_id", propertyId);
    if (error) throw error;
  }
}

export async function adminDeleteMedia(media: PropertyMedia) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("property_media").delete().eq("id", media.id);
  if (error) throw error;

  if (media.storage_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
  }

  if (media.is_cover) {
    const remaining = await adminListPropertyMedia(media.property_id);
    if (remaining[0]) {
      await adminSetMediaCover(media.property_id, remaining[0].id);
    }
  }
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
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Decline reason is required");
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("decline_enquiry", {
    p_enquiry_id: id,
    p_reason: trimmed,
  });
  if (error) throw error;
}

export async function adminUpdateEnquiry(
  id: string,
  patch: Partial<Pick<Enquiry, "admin_notes" | "status">>,
) {
  const supabase = await requireAdminClient();
  if (patch.status && patch.status !== "in_review") {
    throw new Error("Only in_review status updates are allowed from the inbox");
  }
  const { error } = await supabase.from("enquiries").update(patch).eq("id", id);
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: patch.status === "in_review" ? "enquiry.in_review" : "enquiry.notes_updated",
    entity_type: "enquiry",
    entity_id: id,
    meta: patch,
  });
}

export async function adminMarkEnquiryInReview(id: string) {
  return adminUpdateEnquiry(id, { status: "in_review" });
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

  if (patch.status === "cancelled" || patch.status === "refunded") {
    await supabase.from("availability_blocks").delete().eq("booking_id", id);
  }

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

export async function adminDeleteBlock(block: {
  id: string;
  reason: string;
}) {
  if (block.reason === "booked") {
    throw new Error("Booked blocks are removed by cancelling the booking");
  }
  if (block.reason !== "manual" && block.reason !== "hold") {
    throw new Error("Only manual or hold blocks can be deleted here");
  }
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("availability_blocks").delete().eq("id", block.id);
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: "availability.block_deleted",
    entity_type: "availability_block",
    entity_id: block.id,
    meta: { reason: block.reason },
  });
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

export async function adminDeleteReview(id: string) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
  await supabase.from("audit_logs").insert({
    action: "review.deleted",
    entity_type: "review",
    entity_id: id,
    meta: {},
  });
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
