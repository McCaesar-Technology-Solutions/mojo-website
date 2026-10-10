// Paystack webhook: verify signature + amount, confirm booking, convert hold → booked
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac } from "node:crypto";

Deno.serve(async (req) => {
  if (Deno.env.get("PAYSTACK_ENABLED") !== "true") {
    return new Response("paystack disabled", { status: 403 });
  }
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
    const hash = createHmac("sha512", secret).update(raw).digest("hex");
    if (hash !== signature) {
      return new Response("invalid signature", { status: 401 });
    }

    const event = JSON.parse(raw);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (event.event === "charge.success") {
      const reference = event.data?.reference as string;
      const paidAmount = Number(event.data?.amount ?? 0); // pesewas
      const currency = String(event.data?.currency ?? "").toUpperCase();

      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select("*")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (bookingError) return new Response("lookup failed", { status: 500 });
      if (!booking) {
        const recorded = await admin.rpc("record_unmatched_paystack_charge", {
          p_reference: reference,
          p_amount: paidAmount,
          p_currency: currency,
        });
        if (recorded.error) return new Response("unmatched payment was not recorded", { status: 500 });
        console.error(
          JSON.stringify({
            level: "error",
            event: "paystack.payment_unmatched",
            reference,
          }),
        );
        return new Response("ok");
      }

      const expected = Math.round(Number(booking.total) * 100);
      if (currency !== "GHS" || paidAmount !== expected) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "paystack.amount_mismatch",
            reference,
            paidAmount,
            expected,
            currency,
          }),
        );
        await admin.from("audit_logs").insert({
          action: "booking.payment_mismatch",
          entity_type: "booking",
          entity_id: booking.id,
          meta: { reference, paidAmount, expected, currency },
        });
        return new Response("amount mismatch", { status: 400 });
      }

      const settled = await admin.rpc("confirm_paid_booking", {
        p_booking_id: booking.id,
      });
      if (settled.error) return new Response("booking update failed", { status: 500 });

      const outcome = settled.data?.outcome as string | undefined;
      if (outcome === "payment_after_cancel_resolved") {
        console.log(
          JSON.stringify({
            level: "info",
            event: "paystack.payment_after_cancel_resolved",
            bookingId: booking.id,
            reference,
          }),
        );
        return new Response("ok");
      }
      if (outcome === "payment_after_cancel") {
        console.error(
          JSON.stringify({
            level: "error",
            event: "paystack.payment_after_cancel",
            bookingId: booking.id,
            reference,
            handling: "Refund the Paystack charge. The booking stays cancelled.",
          }),
        );
        return new Response("payment needs refund", { status: 409 });
      }
      if (settled.data?.ok !== true || outcome === "occupancy_missing") {
        console.error(
          JSON.stringify({
            level: "error",
            event: "paystack.occupancy_missing",
            bookingId: booking.id,
            reference,
            outcome,
          }),
        );
        return new Response("occupancy missing", { status: 500 });
      }

      if (outcome === "confirmed") {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-enquiry`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ booking_id: booking.id, type: "payment_receipt" }),
        }).catch(() => undefined);
      }

      console.log(
        JSON.stringify({ level: "info", event: "paystack.charge.success", reference, outcome }),
      );
    }

    return new Response("ok");
  } catch (e) {
    console.error(JSON.stringify({ level: "error", event: "paystack.webhook", error: String(e) }));
    return new Response("error", { status: 500 });
  }
});
