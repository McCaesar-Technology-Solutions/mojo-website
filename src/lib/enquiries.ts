import { publicReadError } from "@/lib/read-error";
import { z } from "zod";
import { calcStayTotal, nightsBetween } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import { submitEnquiryFn } from "@/lib/enquiries.functions";
import type { EnquiryConfirmation } from "@/lib/enquiry-submission";
import type { Enquiry, EnquiryInput, Property } from "@/types/domain";

export const enquirySchema = z.object({
  property_id: z.string().uuid("Invalid property"),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  guests: z.number().int().min(1).max(20),
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(40),
  notes: z.string().max(2000).optional(),
  website: z.string().max(0).optional(),
});

export type EnquiryFormValues = z.infer<typeof enquirySchema>;

export function buildEnquiryTotals(property: Property, checkIn: string, checkOut: string) {
  const nightly = property.pricing?.nightly_rate ?? 0;
  const cleaning = property.pricing?.cleaning_fee ?? 0;
  const rate = property.pricing?.service_fee_rate ?? 0.046875;
  const nights = nightsBetween(checkIn, checkOut);
  return { nightly, cleaning, ...calcStayTotal(nightly, nights, cleaning, rate) };
}

export async function submitEnquiry(
  input: EnquiryInput,
  property: Property,
): Promise<{ enquiry: EnquiryConfirmation; source: "supabase" }> {
  const parsed = enquirySchema.parse({
    ...input,
    property_id: property.id,
  });
  if (parsed.website) {
    throw new Error("Spam detected");
  }

  const totals = buildEnquiryTotals(property, parsed.check_in, parsed.check_out);
  if (totals.nights <= 0) throw new Error("Check-out must be after check-in");
  if (parsed.guests > property.max_guests) {
    throw new Error(`This stay allows up to ${property.max_guests} guests`);
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Booking is temporarily unavailable. Please try again shortly.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Insert and PMS sync run on the server for this submission only.
  // A failed PMS sync still returns the saved enquiry.
  const { enquiry } = await submitEnquiryFn({
    data: {
      property_id: property.id,
      check_in: parsed.check_in,
      check_out: parsed.check_out,
      guests: parsed.guests,
      full_name: parsed.full_name,
      email: parsed.email,
      phone: parsed.phone,
      notes: parsed.notes,
      website: parsed.website,
      accessToken: session?.access_token,
    },
  });

  return { enquiry, source: "supabase" };
}

export async function listMyEnquiries(): Promise<Enquiry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, property:properties(*)")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  if (error) throw publicReadError();
  return (data ?? []) as Enquiry[];
}
