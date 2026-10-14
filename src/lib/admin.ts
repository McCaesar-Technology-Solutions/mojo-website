import {
  amenityDeleteErrorMessage,
  amenityRpcErrorMessage,
  amenityWriteErrorMessage,
} from "@/lib/amenity-consistency";
import { bookingMutationErrorMessage } from "@/lib/booking-mutation";
import {
  PMS_CONFIRM_RECONCILE_MESSAGE,
  PMS_CONFIRM_RETRY_MESSAGE,
  PMS_DECLINE_RETRY_MESSAGE,
  isEnquiryAlreadyApprovedError,
  mojoApprovalErrorMessage,
  planWebsiteApproval,
  planWebsiteDecline,
  pmsConfirmFailure,
  syncBlockMessage,
} from "@/lib/enquiry-approval";
import {
  MediaPersistError,
  PROPERTY_STORAGE_PARTIAL,
  STORAGE_DELETE_PARTIAL,
  mediaRpcErrorMessage,
  shouldDeleteUploadedObject,
} from "@/lib/media-consistency";
import { AUDIT_PARTIAL, publicReadError } from "@/lib/read-error";
import { parseAdminOpsMetrics, reviewMutationErrorMessage } from "@/lib/review-stats";
import { getSupabase } from "@/lib/supabase/client";
import {
  confirmWebsiteEnquiryFn,
  declineWebsiteEnquiryFn,
  retryEnquiryPmsSyncFn,
} from "@/lib/pms.functions";
import type {
  Amenity,
  AuditLog,
  Booking,
  Enquiry,
  Message,
  MessageThread,
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
    media: (row.property_media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw publicReadError();
  if (profile?.role !== "admin") throw new Error("Admin access required");
  return supabase;
}

export async function adminOpsMetrics() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase.rpc("admin_ops_metrics");
  if (error) throw new Error(reviewMutationErrorMessage(error));
  return parseAdminOpsMetrics(data);
}

export async function adminDashboardStats() {
  const metrics = await adminOpsMetrics();
  return {
    publishedProperties: metrics.publishedProperties,
    newEnquiries: metrics.newEnquiries,
    bookings: metrics.bookings,
    revenue: metrics.revenue,
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
  if (error) throw publicReadError();
  return ((data ?? []) as AdminPropertyRow[]).map(mapAdminProperty);
}

export async function adminListAmenities() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("amenities")
    .select("id, label, icon, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw publicReadError();
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
  if (error) throw new Error(amenityWriteErrorMessage(error.message));
  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "amenity.created",
    entity_type: "amenity",
    entity_id: data.id,
    meta: { label: data.label },
  });
  if (auditError) throw new Error("The amenity was saved, but the audit record failed.");
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
  if (error) throw new Error(amenityWriteErrorMessage(error.message));
  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "amenity.updated",
    entity_type: "amenity",
    entity_id: id,
    meta: payload,
  });
  if (auditError) throw new Error("The amenity was saved, but the audit record failed.");
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
  if (error) throw new Error(amenityDeleteErrorMessage(error.message));
  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "amenity.deleted",
    entity_type: "amenity",
    entity_id: id,
    meta: {},
  });
  if (auditError) throw new Error("The amenity was deleted, but the audit record failed.");
}

export async function adminSetPropertyAmenities(propertyId: string, amenityIds: string[]) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("replace_property_amenities", {
    p_property_id: propertyId,
    p_amenity_ids: amenityIds,
  });
  if (error) throw new Error(amenityRpcErrorMessage(error.message));
}

export async function adminArchiveProperty(id: string) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("properties")
    .update({ status: "archived", booking_mode: "request" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw publicReadError();
  await recordAudit(supabase, {
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
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("property_id", id),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("property_id", id),
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
  const storagePaths = media.map((m) => m.storage_path).filter((p): p is string => Boolean(p));

  const { data: property, error: loadError } = await supabase
    .from("properties")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw loadError;

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw publicReadError();

  let storageDeleted = storagePaths.length === 0;
  if (storagePaths.length > 0) {
    const removed = await supabase.storage.from(MEDIA_BUCKET).remove(storagePaths);
    storageDeleted = !removed.error;
    if (removed.error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "property.storage_delete_failed",
          propertyId: id,
          message: removed.error.message,
        }),
      );
    }
  }

  if (!storageDeleted) throw new Error(PROPERTY_STORAGE_PARTIAL);

  await recordAudit(supabase, {
    action: "property.deleted",
    entity_type: "property",
    entity_id: id,
    meta: { slug: property?.slug ?? null, storage_deleted: storageDeleted },
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
  if (error) throw publicReadError();

  await recordAudit(supabase, {
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
  if (error) throw publicReadError();
}

async function recordAudit(
  supabase: Awaited<ReturnType<typeof requireAdminClient>>,
  row: { action: string; entity_type: string; entity_id: string; meta: Record<string, unknown> },
) {
  const { error } = await supabase.from("audit_logs").insert(row);
  if (error) throw new Error(AUDIT_PARTIAL);
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
  const nextOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sort_order)) + 1;
  const makeCover = Boolean(options.isCover) || rows.length === 0;

  const { data, error } = await supabase
    .from("property_media")
    .insert({
      property_id: propertyId,
      url: trimmedUrl,
      storage_path: options.storagePath ?? null,
      is_cover: false,
      sort_order: nextOrder,
      alt: options.alt ?? null,
    })
    .select("*")
    .single();
  if (error) throw new MediaPersistError("The photo could not be saved.", false);

  if (makeCover) {
    const { error: coverError } = await supabase.rpc("set_property_cover", {
      p_property_id: propertyId,
      p_media_id: data.id,
    });
    if (coverError) {
      throw new MediaPersistError(mediaRpcErrorMessage(coverError.message), true);
    }
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "media.added",
    entity_type: "property",
    entity_id: propertyId,
    meta: { media_id: data.id, is_cover: makeCover },
  });
  if (auditError) {
    throw new MediaPersistError("The photo was saved, but the audit record failed.", true);
  }
  return { ...(data as PropertyMedia), is_cover: makeCover };
}

export async function adminListPropertyMedia(propertyId: string) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("property_media")
    .select("*")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });
  if (error) throw publicReadError();
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
  try {
    return await adminAddMedia(propertyId, publicData.publicUrl, {
      storagePath,
      alt: alt ?? null,
    });
  } catch (error) {
    if (shouldDeleteUploadedObject(error)) {
      const removed = await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      if (removed.error) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "media.upload_cleanup_failed",
            propertyId,
            message: removed.error.message,
          }),
        );
      }
    }
    throw error;
  }
}

export async function adminSetMediaCover(propertyId: string, mediaId: string) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("set_property_cover", {
    p_property_id: propertyId,
    p_media_id: mediaId,
  });
  if (error) throw new Error(mediaRpcErrorMessage(error.message));
}

export async function adminUpdateMediaAlt(mediaId: string, alt: string | null) {
  const supabase = await requireAdminClient();
  const { error } = await supabase
    .from("property_media")
    .update({ alt: alt?.trim() || null })
    .eq("id", mediaId);
  if (error) throw publicReadError();
  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "media.alt_updated",
    entity_type: "property_media",
    entity_id: mediaId,
    meta: {},
  });
  if (auditError) throw new Error("The alt text was saved, but the audit record failed.");
}

export async function adminReorderMedia(propertyId: string, orderedIds: string[]) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("reorder_property_media", {
    p_property_id: propertyId,
    p_ordered_ids: orderedIds,
  });
  if (error) throw new Error(mediaRpcErrorMessage(error.message));
}

export async function adminDeleteMedia(media: PropertyMedia) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("property_media").delete().eq("id", media.id);
  if (error) throw new Error("The photo could not be removed.");

  if (media.is_cover) {
    const remaining = await adminListPropertyMedia(media.property_id);
    if (remaining[0]) {
      await adminSetMediaCover(media.property_id, remaining[0].id);
    }
  }

  let storageDeleted = !media.storage_path;
  if (media.storage_path) {
    const removed = await supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
    storageDeleted = !removed.error;
    if (removed.error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "media.storage_delete_failed",
          propertyId: media.property_id,
          mediaId: media.id,
          message: removed.error.message,
        }),
      );
    }
  }

  if (!storageDeleted) throw new Error(STORAGE_DELETE_PARTIAL);

  await recordAudit(supabase, {
    action: "media.deleted",
    entity_type: "property",
    entity_id: media.property_id,
    meta: { media_id: media.id, storage_deleted: storageDeleted },
  });
}

export async function adminListEnquiries() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*, property:properties(title, slug)")
    .order("created_at", { ascending: false });
  if (error) throw publicReadError();
  return (data ?? []) as Enquiry[];
}

async function adminAccessToken() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");
  return session.access_token;
}

export async function adminApproveEnquiry(id: string, notes?: string) {
  const supabase = await requireAdminClient();
  const accessToken = await adminAccessToken();
  const { data: enquiry, error: loadError } = await supabase
    .from("enquiries")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw new Error("Enquiry could not be loaded.");
  if (!enquiry) throw new Error("Enquiry not found.");

  const plan = planWebsiteApproval(enquiry.status);
  if (plan === "closed") throw new Error("This enquiry is already closed.");

  const synced = await retryEnquiryPmsSyncFn({ data: { enquiryId: id, accessToken } });
  if (!synced.ok) {
    const syncBlock = syncBlockMessage(synced.code);
    if (syncBlock && plan === "approve_then_confirm") throw new Error(syncBlock);
  }

  let bookingId: string | null = null;
  if (plan === "approve_then_confirm") {
    const { data, error } = await supabase.rpc("approve_enquiry", {
      p_enquiry_id: id,
      p_admin_notes: notes ?? null,
    });
    if (error) {
      if (!isEnquiryAlreadyApprovedError(error.message)) {
        throw new Error(mojoApprovalErrorMessage(error.message));
      }
    } else {
      bookingId = data as string;
    }
  }

  if (!bookingId) {
    const { data: existing, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("enquiry_id", id)
      .maybeSingle();
    if (bookingError) throw publicReadError();
    bookingId = existing?.id ?? null;
  }

  if (synced.ok || plan === "confirm_only") {
    const confirmed = await confirmWebsiteEnquiryFn({
      data: { enquiryId: id, accessToken },
    });
    const failure = pmsConfirmFailure(
      confirmed.ok ? undefined : confirmed.code,
      "skipped" in confirmed ? confirmed.skipped : false,
    );
    if (failure === "reconcile") throw new Error(PMS_CONFIRM_RECONCILE_MESSAGE);
    if (failure === "retry") throw new Error(PMS_CONFIRM_RETRY_MESSAGE);
  }

  if (!bookingId) throw new Error("Website approval did not create a booking.");
  return bookingId;
}

export async function adminDeclineEnquiry(id: string, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Decline reason is required");
  const supabase = await requireAdminClient();
  const accessToken = await adminAccessToken();
  const { data: enquiry, error: loadError } = await supabase
    .from("enquiries")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw new Error("Enquiry could not be loaded.");
  if (!enquiry) throw new Error("Enquiry not found.");

  const plan = planWebsiteDecline(enquiry.status);
  if (plan === "closed") throw new Error("This enquiry can no longer be declined.");

  if (plan === "decline_then_release") {
    const { error } = await supabase.rpc("decline_enquiry", {
      p_enquiry_id: id,
      p_reason: trimmed,
    });
    if (error) throw new Error("Website decline failed.");
  }

  const declined = await declineWebsiteEnquiryFn({
    data: { enquiryId: id, accessToken },
  });
  if (!declined.ok && !("skipped" in declined && declined.skipped)) {
    throw new Error(PMS_DECLINE_RETRY_MESSAGE);
  }
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
  if (error) throw publicReadError();
  await recordAudit(supabase, {
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
  if (error) throw publicReadError();
  return (data ?? []) as Booking[];
}

export async function adminUpdateBooking(
  id: string,
  patch: Partial<Pick<Booking, "status" | "admin_notes" | "check_in" | "check_out">>,
) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("admin_update_booking", {
    p_booking_id: id,
    p_patch: patch,
  });
  if (error) throw new Error(bookingMutationErrorMessage(error));
}

export async function adminListBlocks(propertyId?: string) {
  const supabase = await requireAdminClient();
  let q = supabase
    .from("availability_blocks")
    .select("*, property:properties(title)")
    .order("start_date");
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) throw publicReadError();
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
  const { data, error } = await supabase
    .from("availability_blocks")
    .insert(input)
    .select("id")
    .single();
  if (error) throw publicReadError();
  await recordAudit(supabase, {
    action: "availability.block_created",
    entity_type: "availability_block",
    entity_id: data.id,
    meta: input,
  });
}

export async function adminDeleteBlock(block: { id: string; reason: string }) {
  if (block.reason === "booked" || block.reason === "pms") {
    throw new Error(
      block.reason === "pms"
        ? "PMS occupancy blocks are managed from the Property Management System"
        : "Booked blocks are removed by cancelling the booking",
    );
  }
  if (block.reason !== "manual" && block.reason !== "hold") {
    throw new Error("Only manual or hold blocks can be deleted here");
  }
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("availability_blocks").delete().eq("id", block.id);
  if (error) throw publicReadError();
  await recordAudit(supabase, {
    action: "availability.block_deleted",
    entity_type: "availability_block",
    entity_id: block.id,
    meta: { reason: block.reason },
  });
}

export async function adminListGuests() {
  const supabase = await requireAdminClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at, updated_at")
    .eq("role", "guest")
    .order("updated_at", { ascending: false });
  const { data: bookings, error: bookingError } = await supabase
    .from("bookings")
    .select("guest_name, guest_email, guest_phone, created_at")
    .order("created_at", { ascending: false });
  if (profileError || bookingError) throw publicReadError();
  return { profiles: profiles ?? [], bookingContacts: bookings ?? [] };
}

/** Name/phone only — never role. Admin bootstrap stays SQL-only. */
export async function adminUpdateGuest(
  id: string,
  patch: { full_name?: string | null; phone?: string | null },
) {
  const supabase = await requireAdminClient();
  const { data: existing, error: loadError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!existing) throw new Error("Guest not found");
  if (existing.role !== "guest") {
    throw new Error("Only guest profiles can be edited here");
  }

  const payload = {
    ...(patch.full_name !== undefined ? { full_name: patch.full_name?.trim() || null } : {}),
    ...(patch.phone !== undefined ? { phone: patch.phone?.trim() || null } : {}),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .eq("role", "guest")
    .select("id, full_name, phone, role, created_at, updated_at")
    .single();
  if (error) throw publicReadError();

  await recordAudit(supabase, {
    action: "guest.updated",
    entity_type: "profile",
    entity_id: id,
    meta: payload,
  });
  return data;
}

export async function adminListMessageThreads() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("message_threads")
    .select(
      "*, messages(*), enquiry:enquiries(id, full_name, email, phone, property:properties(title, slug))",
    )
    .order("created_at", { ascending: false });
  if (error) throw publicReadError();

  const threads = (data ?? []) as Array<
    MessageThread & {
      enquiry?: {
        id: string;
        full_name: string;
        email: string;
        phone: string;
        property?: { title: string; slug: string } | null;
      } | null;
      messages?: Message[];
    }
  >;

  const guestIds = [
    ...new Set(threads.map((t) => t.guest_id).filter((id): id is string => Boolean(id))),
  ];
  let profilesById: Record<string, { full_name: string | null; phone: string | null }> = {};
  if (guestIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", guestIds);
    if (profileError) throw publicReadError();
    profilesById = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, phone: p.phone }]),
    );
  }

  return threads.map((t) => ({
    ...t,
    messages: (t.messages ?? []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    guest_profile: t.guest_id ? (profilesById[t.guest_id] ?? null) : null,
  }));
}

export async function adminReplyToThread(threadId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message body is required");
  const supabase = await requireAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: trimmed,
    })
    .select("*")
    .single();
  if (error) throw publicReadError();

  await recordAudit(supabase, {
    action: "message.replied",
    entity_type: "message_thread",
    entity_id: threadId,
    meta: { message_id: data.id },
  });
  return data as Message;
}

export async function adminListReviews() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, property:properties(title)")
    .order("created_at", { ascending: false });
  if (error) throw publicReadError();
  return (data ?? []) as Review[];
}

export async function adminModerateReview(id: string, status: "approved" | "rejected") {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("moderate_review", {
    p_review_id: id,
    p_status: status,
  });
  if (error) throw new Error(reviewMutationErrorMessage(error));
}

export async function adminDeleteReview(id: string) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.rpc("delete_review", { p_review_id: id });
  if (error) throw new Error(reviewMutationErrorMessage(error));
}

export async function adminListUnresolvedLatePayments() {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, meta, created_at")
    .in("action", ["booking.payment_after_cancel", "booking.payment_unmatched"])
    .filter("meta->>resolved_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw publicReadError();
  return (data ?? []) as AuditLog[];
}

export async function adminListAuditLogs(limit = 150) {
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw publicReadError();
  return (data ?? []) as AuditLog[];
}

export async function adminRefundBooking(_bookingId: string, _amountPesewas?: number) {
  throw new Error("Paystack refunds are deferred until Instant Book.");
}
