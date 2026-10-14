import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parseManualRefundVerification } from "../_shared/paystack-recovery.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (Deno.env.get("PAYSTACK_ENABLED") !== "true") {
    return json({ error: "Paystack is not enabled" }, 403);
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") return json({ error: "Admin only" }, 403);

    const body = await req.json();
    const bookingId = body?.booking_id;
    if (typeof bookingId !== "string" || bookingId.length === 0) {
      return json({ error: "Booking is required" }, 400);
    }
    const parsed = parseManualRefundVerification({
      outcome: body?.outcome,
      reference: body?.reference,
      evidence: body?.evidence,
    });
    if (!parsed.ok) return json({ error: parsed.error }, 400);

    const recorded = await admin.rpc("record_manual_refund_verification", {
      p_booking_id: bookingId,
      p_actor_id: user.id,
      p_outcome: parsed.outcome,
      p_reference: parsed.reference,
      p_evidence: parsed.evidence,
    });
    if (recorded.error) {
      const message = recorded.error.message ?? "";
      if (message.includes("BOOKING_NOT_AUTHORIZED")) return json({ error: "Admin only" }, 403);
      if (message.includes("BOOKING_NOT_FOUND")) return json({ error: "Booking not found" }, 404);
      return json({ error: "The verification could not be recorded." }, 400);
    }

    if (recorded.data?.action === "unchanged") {
      return json({
        ok: true,
        outcome: "unknown",
        occupancyReleased: false,
      });
    }

    const finalized = await admin.rpc("finalize_paystack_refund", { p_booking_id: bookingId });
    if (finalized.error) {
      return json(
        {
          error:
            "The verified refund was recorded, but the booking or calendar could not be updated. Retry local cleanup. Another Paystack refund will not be sent.",
        },
        502,
      );
    }

    return json({ ok: true, outcome: "accepted", occupancyReleased: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Failed" }, 400);
  }
});
