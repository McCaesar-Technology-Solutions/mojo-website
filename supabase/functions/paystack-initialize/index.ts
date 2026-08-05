// Supabase Edge Function: initialize Paystack Instant Book checkout
// Secrets: PAYSTACK_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, APP_URL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  let holdId: string | null = null;
  let bookingId: string | null = null;
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
    const reference = `mojo_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;

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

    await admin.from("availability_blocks").update({ booking_id: booking.id }).eq("id", hold.id);

    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
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
    const paystackJson = await paystackRes.json();
    if (!paystackJson.status) {
      throw new Error(paystackJson.message ?? "Paystack init failed");
    }

    await admin
      .from("bookings")
      .update({ paystack_access_code: paystackJson.data.access_code })
      .eq("id", booking.id);

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
    // Roll back hold + pending booking if Paystack init fails mid-flow
    if (admin) {
      if (bookingId) {
        await admin.from("bookings").delete().eq("id", bookingId).eq("status", "pending_payment");
      }
      if (holdId) {
        await admin.from("availability_blocks").delete().eq("id", holdId).eq("reason", "hold");
      }
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
