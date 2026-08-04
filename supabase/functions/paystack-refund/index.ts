import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
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
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") throw new Error("Admin only");

    const { booking_id, amount } = await req.json();
    const { data: booking } = await admin
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();
    if (!booking?.paystack_reference) throw new Error("No Paystack reference");

    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: booking.paystack_reference,
        ...(amount ? { amount } : {}),
      }),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.message ?? "Refund failed");

    await admin.from("bookings").update({ status: "refunded" }).eq("id", booking_id);
    await admin.from("availability_blocks").delete().eq("booking_id", booking_id);
    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "booking.refunded",
      entity_type: "booking",
      entity_id: booking_id,
      meta: json.data ?? {},
    });

    return new Response(JSON.stringify({ ok: true, data: json.data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
