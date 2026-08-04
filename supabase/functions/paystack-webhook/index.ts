// Paystack webhook: confirm booking, convert hold → booked, email receipt hook
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
      const { data: booking } = await admin
        .from("bookings")
        .select("*")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (!booking) return new Response("ok");

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
        meta: { reference },
      });

      // Best-effort email via notify function
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
