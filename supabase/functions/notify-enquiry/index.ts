// Email notifications via Resend (optional). Logs always.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.log(JSON.stringify({ level: "warn", event: "email.skipped", to, subject }));
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") ?? "MOJO <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
    );
    const notify = Deno.env.get("ADMIN_NOTIFY_EMAIL");

    if (body.enquiry_id) {
      const { data: enquiry } = await admin
        .from("enquiries")
        .select("*, property:properties(title)")
        .eq("id", body.enquiry_id)
        .single();
      if (enquiry) {
        await sendEmail(
          enquiry.email,
          "We received your MOJO enquiry",
          `<p>Hi ${enquiry.full_name},</p><p>Thanks for enquiring about <strong>${enquiry.property?.title ?? "a stay"}</strong> (${enquiry.check_in} → ${enquiry.check_out}). We'll confirm within 24 hours.</p>`,
        );
        if (notify) {
          await sendEmail(
            notify,
            `New enquiry: ${enquiry.property?.title ?? enquiry.id}`,
            `<p>${enquiry.full_name} (${enquiry.email}) · ${enquiry.check_in} → ${enquiry.check_out} · GHS ${enquiry.total}</p>`,
          );
        }
      }
    }

    if (body.booking_id && body.type === "payment_receipt") {
      const { data: booking } = await admin
        .from("bookings")
        .select("*, property:properties(title)")
        .eq("id", body.booking_id)
        .single();
      if (booking) {
        await sendEmail(
          booking.guest_email,
          "MOJO booking confirmed",
          `<p>Hi ${booking.guest_name},</p><p>Your stay at <strong>${booking.property?.title}</strong> is confirmed (${booking.check_in} → ${booking.check_out}). Total paid: GHS ${booking.total}. Ref: ${booking.paystack_reference}</p>`,
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(String(e));
    return new Response(JSON.stringify({ error: "failed" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
