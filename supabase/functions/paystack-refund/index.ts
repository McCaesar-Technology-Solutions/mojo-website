import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { refundRetryCallsProvider, type RefundAction } from "../_shared/paystack-recovery.ts";

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

    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("Booking is required");

    const claim = await admin.rpc("claim_paystack_refund", { p_booking_id: booking_id });
    if (claim.error) throw new Error("Refund could not be started");
    const action = claim.data?.action as RefundAction | undefined;

    if (action === "unknown" || !refundRetryCallsProvider(action ?? "unknown") && action !== "reconcile") {
      return json(
        {
          error:
            "A refund was already sent and its result was not recorded. Do not send another refund. Reconcile this charge in Paystack, then retry local cleanup only after the database shows the refund as accepted.",
        },
        409,
      );
    }

    if (action === "call_provider") {
      let paystackResult: "accepted" | "rejected" | "unknown" = "unknown";
      try {
        const res = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transaction: claim.data.reference }),
        });
        const body = await res.json();
        paystackResult = body?.status ? "accepted" : "rejected";
      } catch {
        paystackResult = "unknown";
      }

      if (paystackResult === "unknown") {
        return json(
          {
            error:
              "Paystack did not return a refund result. The booking was left unchanged and another refund will not be sent automatically.",
          },
          502,
        );
      }

      if (paystackResult === "rejected") {
        const aborted = await admin.rpc("abort_paystack_refund", { p_booking_id: booking_id });
        if (aborted.error) {
          return json(
            {
              error:
                "Paystack rejected the refund, and the local attempt could not be cleared. Do not send another refund until that state is reconciled.",
            },
            502,
          );
        }
        return json({ error: "Paystack rejected the refund. No calendar change was made." }, 400);
      }

      const marked = await admin.rpc("mark_paystack_refund_accepted", { p_booking_id: booking_id });
      if (marked.error) {
        return json(
          {
            error:
              "Paystack accepted the refund, but that acceptance was not saved. Do not send another refund. Reconcile the booking before retrying cleanup.",
          },
          502,
        );
      }
    }

    const finalized = await admin.rpc("finalize_paystack_refund", { p_booking_id: booking_id });
    if (finalized.error) {
      return json(
        {
          error:
            "The refund is recorded as accepted, but the booking status or calendar could not be updated. Retry cleanup. Another Paystack refund will not be sent.",
        },
        502,
      );
    }

    return json({ ok: true, occupancyReleased: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Failed" }, 400);
  }
});
