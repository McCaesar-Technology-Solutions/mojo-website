import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireServiceSupabase } from "@/lib/supabase/server";
import { PMS_CONFIRM_PENDING, PMS_DECLINE_PENDING } from "@/lib/enquiry-approval";
import { confirmEnquiryInPms, declineEnquiryInPms, isPmsConfigured } from "@/lib/pms";
import { syncEnquiryRecord } from "@/lib/pms-sync";

const adminEnquirySchema = z.object({
  enquiryId: z.string().uuid(),
  accessToken: z.string().min(20),
});

async function requireAdminToken(accessToken: string) {
  const supabase = requireServiceSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return { supabase, userId: user.id };
}

/**
 * Admin-only retry. Guests cannot pass an enquiry id into a service-role sync.
 * The guest path syncs only the row created inside submitEnquiryFn.
 */
export const retryEnquiryPmsSyncFn = createServerFn({ method: "POST" })
  .validator(adminEnquirySchema)
  .handler(async ({ data }) => {
    const { userId } = await requireAdminToken(data.accessToken);
    return syncEnquiryRecord(data.enquiryId, userId);
  });

export const confirmWebsiteEnquiryFn = createServerFn({ method: "POST" })
  .validator(adminEnquirySchema)
  .handler(async ({ data }) => {
    const { supabase, userId } = await requireAdminToken(data.accessToken);
    if (!isPmsConfigured()) {
      return { ok: false as const, skipped: true, code: "UNCONFIGURED" };
    }

    const result = await confirmEnquiryInPms(data.enquiryId);
    if (!result.ok) {
      await supabase.from("audit_logs").insert({
        actor_id: userId,
        action: "enquiry.pms_confirm",
        entity_type: "enquiry",
        entity_id: data.enquiryId,
        meta: { ok: false, code: result.code },
      });
      console.error(
        JSON.stringify({
          level: "error",
          event: "pms.enquiry_confirm",
          enquiryId: data.enquiryId,
          operation: "confirm",
          code: result.code,
        }),
      );
      if (result.code === "NOT_FOUND") {
        return { ok: false as const, skipped: true, code: "NOT_FOUND" };
      }
      await supabase
        .from("enquiries")
        .update({ pms_sync_error: PMS_CONFIRM_PENDING })
        .eq("id", data.enquiryId);
      return { ok: false as const, code: result.code };
    }

    if (!result.reservationId) {
      return {
        ok: false as const,
        code: "PMS_ERROR",
        error: "PMS confirmation did not return a reservation id.",
      };
    }

    const { error } = await supabase
      .from("enquiries")
      .update({ pms_reservation_id: result.reservationId, pms_sync_error: null })
      .eq("id", data.enquiryId);
    if (error) {
      await supabase
        .from("enquiries")
        .update({ pms_sync_error: PMS_CONFIRM_PENDING })
        .eq("id", data.enquiryId);
      console.error(
        JSON.stringify({
          level: "error",
          event: "pms.enquiry_confirm.write",
          enquiryId: data.enquiryId,
          reservationId: result.reservationId,
          error: error.message,
        }),
      );
      return {
        ok: false as const,
        code: "WRITE_FAILED",
        error: "PMS confirmed the stay but the website could not store the reservation id.",
        reservationId: result.reservationId,
      };
    }

    await supabase.from("audit_logs").insert({
      actor_id: userId,
      action: "enquiry.pms_confirm",
      entity_type: "enquiry",
      entity_id: data.enquiryId,
      meta: { ok: true, reservationId: result.reservationId },
    });

    return { ok: true as const, reservationId: result.reservationId };
  });

export const declineWebsiteEnquiryFn = createServerFn({ method: "POST" })
  .validator(adminEnquirySchema)
  .handler(async ({ data }) => {
    const { supabase, userId } = await requireAdminToken(data.accessToken);
    if (!isPmsConfigured()) {
      return { ok: false as const, skipped: true, code: "UNCONFIGURED" };
    }

    const result = await declineEnquiryInPms(data.enquiryId);
    const failed = !result.ok && result.code !== "NOT_FOUND";
    await supabase.from("audit_logs").insert({
      actor_id: userId,
      action: "enquiry.pms_decline",
      entity_type: "enquiry",
      entity_id: data.enquiryId,
      meta: { ok: !failed, code: result.ok ? "ok" : result.code },
    });
    if (failed) {
      await supabase
        .from("enquiries")
        .update({ pms_sync_error: PMS_DECLINE_PENDING })
        .eq("id", data.enquiryId);
      console.error(
        JSON.stringify({
          level: "error",
          event: "pms.enquiry_decline",
          enquiryId: data.enquiryId,
          operation: "decline",
          code: result.code,
        }),
      );
      return { ok: false as const, code: result.code };
    }

    if (result.ok) {
      await supabase
        .from("enquiries")
        .update({ pms_sync_error: null })
        .eq("id", data.enquiryId)
        .eq("pms_sync_error", PMS_DECLINE_PENDING);
    }

    return { ok: true as const, skipped: !result.ok };
  });
