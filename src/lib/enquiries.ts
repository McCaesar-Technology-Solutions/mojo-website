import { z } from "zod";
import { calcStayTotal, nightsBetween } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import type { Enquiry, EnquiryInput, Property } from "@/types/domain";

export const enquirySchema = z.object({
  property_id: z.string().min(1),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  guests: z.number().int().min(1).max(20),
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(40),
  notes: z.string().max(2000).optional(),
  website: z.string().max(0).optional(), // honeypot must stay empty
});

export type EnquiryFormValues = z.infer<typeof enquirySchema>;

const DEMO_ENQUIRIES_KEY = "mojo_demo_enquiries";

function readDemoEnquiries(): Enquiry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_ENQUIRIES_KEY) ?? "[]") as Enquiry[];
  } catch {
    return [];
  }
}

function writeDemoEnquiries(items: Enquiry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_ENQUIRIES_KEY, JSON.stringify(items));
}

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
): Promise<{ enquiry: Enquiry; source: "supabase" | "demo" }> {
  const parsed = enquirySchema.parse(input);
  if (parsed.website) {
    throw new Error("Spam detected");
  }

  const totals = buildEnquiryTotals(property, parsed.check_in, parsed.check_out);
  if (totals.nights <= 0) throw new Error("Check-out must be after check-in");
  if (parsed.guests > property.max_guests) {
    throw new Error(`This stay allows up to ${property.max_guests} guests`);
  }

  const supabase = getSupabase();
  const payload = {
    property_id: property.id,
    check_in: parsed.check_in,
    check_out: parsed.check_out,
    guests: parsed.guests,
    full_name: parsed.full_name,
    email: parsed.email,
    phone: parsed.phone,
    notes: parsed.notes ?? null,
    nightly_rate: totals.nightly,
    cleaning_fee: totals.cleaning,
    service_fee: totals.serviceFee,
    total: totals.total,
    currency: "GHS" as const,
    status: "new" as const,
  };

  if (!supabase || property.id.startsWith("p-")) {
    const enquiry: Enquiry = {
      id: crypto.randomUUID(),
      user_id: null,
      admin_notes: null,
      decline_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payload,
      property,
    };
    const existing = readDemoEnquiries();
    writeDemoEnquiries([enquiry, ...existing]);
    return { enquiry, source: "demo" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("enquiries")
    .insert({ ...payload, user_id: user?.id ?? null })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  // Best-effort notification edge function
  void supabase.functions
    .invoke("notify-enquiry", { body: { enquiry_id: data.id } })
    .catch(() => undefined);

  return { enquiry: data as Enquiry, source: "supabase" };
}

export async function listMyEnquiries(): Promise<Enquiry[]> {
  const supabase = getSupabase();
  if (!supabase) return readDemoEnquiries();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return readDemoEnquiries();

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, property:properties(*)")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  if (error) return readDemoEnquiries();
  return (data ?? []) as Enquiry[];
}
