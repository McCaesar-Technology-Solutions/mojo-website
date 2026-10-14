import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireServiceSupabase } from "@/lib/supabase/server";
import { syncEnquiryRecord } from "@/lib/pms-sync";
import {
  assertEnquiryStay,
  assertNotSpam,
  enquiryActorId,
  finishSavedEnquiry,
} from "@/lib/enquiry-submission";

const submitSchema = z.object({
  property_id: z.string().uuid(),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  guests: z.number().int().min(1).max(20),
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(40),
  notes: z.string().max(2000).optional(),
  website: z.string().max(200).optional(),
  accessToken: z.string().min(20).optional(),
});

/**
 * Creates the enquiry, then syncs that row only.
 * There is no enquiryId argument, so a caller cannot target another guest's enquiry.
 * accessToken is optional: anonymous Request to Book stays allowed.
 */
export const submitEnquiryFn = createServerFn({ method: "POST" })
  .validator(submitSchema)
  .handler(async ({ data }) => {
    assertNotSpam(data.website);
    const supabase = requireServiceSupabase();
    let verifiedUserId: string | null = null;

    if (data.accessToken) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(data.accessToken);
      if (error || !user) {
        throw new Response("Unauthorized", { status: 401 });
      }
      verifiedUserId = user.id;
    }
    const userId = enquiryActorId(verifiedUserId);

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, status, max_guests")
      .eq("id", data.property_id)
      .maybeSingle();

    if (propertyError || !property || property.status !== "published") {
      throw new Error("This stay is not available to book.");
    }
    assertEnquiryStay(data.check_in, data.check_out, data.guests, property.max_guests);

    const { data: enquiry, error } = await supabase
      .from("enquiries")
      .insert({
        property_id: data.property_id,
        user_id: userId,
        check_in: data.check_in,
        check_out: data.check_out,
        guests: data.guests,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        notes: data.notes ?? null,
        nightly_rate: 0,
        cleaning_fee: 0,
        service_fee: 0,
        total: 0,
        currency: "GHS",
        status: "new",
      })
      .select("*")
      .single();

    if (error || !enquiry) {
      throw new Error("Could not save enquiry.");
    }

    return finishSavedEnquiry(
      enquiry,
      () => syncEnquiryRecord(enquiry.id, userId),
      (entry) => {
        console.error(
          JSON.stringify({
            level: "error",
            event: "pms.enquiry_sync.submit",
            enquiryId: entry.enquiryId,
            code: entry.code,
          }),
        );
      },
    );
  });
