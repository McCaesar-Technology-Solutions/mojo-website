// Paystack webhook: verify signature + amount, confirm booking, convert hold → booked
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac } from "node:crypto";

Deno.serve(async (req) => {
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

      const { data: booking } = await admin
        .from("bookings")
        .select("*")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (!booking) return new Response("ok");

      if (booking.status === "confirmed") {
        return new Response("ok"); // idempotent
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

      await admin.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);

      await admin
        .from("availability_blocks")
        .update({ reason: "booked" })
        .eq("booking_id", booking.id)
        .eq("reason", "hold");

      await admin.from("audit_logs").insert({
        action: "booking.paid",
        entity_type: "booking",
        entity_id: booking.id,
        meta: { reference, paidAmount },
      });

      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-enquiry`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ booking_id: booking.id, type: "payment_receipt" }),
      }).catch(() => undefined);

      console.log(JSON.stringify({ level: "info", event: "paystack.charge.success", reference }));
    }

    return new Response("ok");
  } catch (e) {
    console.error(JSON.stringify({ level: "error", event: "paystack.webhook", error: String(e) }));
    return new Response("error", { status: 500 });
  }
});
