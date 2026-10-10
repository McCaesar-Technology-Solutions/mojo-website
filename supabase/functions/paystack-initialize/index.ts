// Supabase Edge Function: initialize Paystack Instant Book checkout
// Secrets: PAYSTACK_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, APP_URL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { preserveCheckout, type CheckoutOutcome } from "../_shared/paystack-recovery.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function paystackDisabled() {
  if (Deno.env.get("PAYSTACK_ENABLED") === "true") return null;
  return new Response(JSON.stringify({ error: "Paystack is not enabled" }), {
    status: 403,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const disabled = paystackDisabled();
  if (disabled) return disabled;

  let holdId: string | null = null;
  let bookingId: string | null = null;
  let reference: string | null = null;
  let checkoutOutcome: CheckoutOutcome = "not_called";
  let admin: ReturnType<typeof createClient> | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user?.email) throw new Error("Unauthorized");

    const body = await req.json();
    const { property_id, check_in, check_out, guests } = body;
    if (!property_id || !check_in || !check_out || !guests) {
      throw new Error("Missing booking fields");
    }
    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      throw new Error("Invalid guest count");
    }

    admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: property, error: pErr } = await admin
      .from("properties")
      .select("*, property_pricing(*)")
      .eq("id", property_id)
      .eq("status", "published")
      .eq("booking_mode", "instant")
      .single();
    if (pErr || !property) throw new Error("Property not available for Instant Book");
    if (guestCount > property.max_guests) {
      throw new Error(`This stay allows up to ${property.max_guests} guests`);
    }

    const { data: available } = await admin.rpc("property_is_available", {
      p_property_id: property_id,
      p_check_in: check_in,
      p_check_out: check_out,
    });
    if (!available) throw new Error("Dates unavailable");

    const pricing = Array.isArray(property.property_pricing)
      ? property.property_pricing[0]
      : property.property_pricing;
    if (!pricing) throw new Error("Property has no pricing");

    const nights =
      (new Date(check_out + "T00:00:00Z").getTime() -
        new Date(check_in + "T00:00:00Z").getTime()) /
      86400000;
    if (!Number.isInteger(nights) || nights < 1) throw new Error("Invalid dates");

    const subtotal = Number(pricing.nightly_rate) * nights;
    const cleaning = Number(pricing.cleaning_fee);
    const service = Math.round(subtotal * Number(pricing.service_fee_rate));
    const total = subtotal + cleaning + service;
    const amountPesewas = Math.round(total * 100);
    reference = `mojo_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;

    const { data: hold, error: holdErr } = await admin
      .from("availability_blocks")
      .insert({
        property_id,
        start_date: check_in,
        end_date: check_out,
        reason: "hold",
        notes: `paystack:${reference}`,
      })
      .select("id")
      .single();
    if (holdErr || !hold) throw new Error(holdErr?.message ?? "Could not hold dates");
    holdId = hold.id;

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .insert({
        property_id,
        user_id: user.id,
        check_in,
        check_out,
        guests: guestCount,
        guest_name: user.user_metadata?.full_name ?? user.email,
        guest_email: user.email,
        guest_phone: user.user_metadata?.phone ?? "",
        status: "pending_payment",
        nightly_rate: pricing.nightly_rate,
        nights,
        cleaning_fee: cleaning,
        service_fee: service,
        total,
        currency: "GHS",
        paystack_reference: reference,
      })
      .select("id")
      .single();
    if (bErr || !booking) throw new Error(bErr?.message ?? "Could not create booking");
    bookingId = booking.id;

    const linked = await admin.rpc("attach_paystack_hold", {
      p_booking_id: booking.id,
      p_block_id: hold.id,
    });
    if (linked.error) throw new Error("Could not link payment hold");

    const markedUnknown = await admin
      .from("bookings")
      .update({ paystack_checkout_state: "provider_unknown" })
      .eq("id", booking.id);
    if (markedUnknown.error) throw new Error("Could not record checkout state");
    checkoutOutcome = "unknown";

    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";
    let paystackRes: Response;
    try {
      paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountPesewas,
        currency: "GHS",
        reference,
        callback_url: `${appUrl}/booking/success?reference=${reference}`,
        metadata: {
          booking_id: booking.id,
          property_id,
          expected_amount: amountPesewas,
        },
      }),
    });
    } catch {
      checkoutOutcome = "unknown";
      throw new Error("Paystack did not return a checkout result");
    }
    const paystackJson = await paystackRes.json();
    if (!paystackJson.status) {
      checkoutOutcome = "rejected";
      throw new Error(paystackJson.message ?? "Paystack init failed");
    }
    checkoutOutcome = "accepted";

    const accepted = await admin
      .from("bookings")
      .update({
        paystack_checkout_state: "provider_accepted",
        paystack_access_code: paystackJson.data.access_code,
      })
      .eq("id", booking.id);
    if (accepted.error) {
      throw new Error("Paystack accepted the checkout, but the booking could not store it");
    }

    console.log(
      JSON.stringify({
        level: "info",
        event: "paystack.initialize",
        booking_id: booking.id,
        reference,
        amount: amountPesewas,
      }),
    );

    return new Response(
      JSON.stringify({
        authorization_url: paystackJson.data.authorization_url,
        access_code: paystackJson.data.access_code,
        reference,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    // Delete the hold only when Paystack has not been asked, or explicitly rejected the checkout.
    if (admin && !preserveCheckout(checkoutOutcome)) {
      if (bookingId) {
        await admin.from("bookings").delete().eq("id", bookingId).eq("status", "pending_payment");
      }
      if (holdId) {
        await admin.from("availability_blocks").delete().eq("id", holdId).eq("reason", "hold");
      }
    }
    if (preserveCheckout(checkoutOutcome)) {
      return new Response(
        JSON.stringify({
          error: e instanceof Error ? e.message : "Checkout needs reconciliation",
          booking_id: bookingId,
          reference,
          reconciliation: "preserved",
        }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    console.error(
      JSON.stringify({ level: "error", event: "paystack.initialize", error: String(e) }),
    );
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
