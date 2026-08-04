// Cron: release payment holds older than 30 minutes and cancel pending bookings
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: holds } = await admin
    .from("availability_blocks")
    .select("id, booking_id")
    .eq("reason", "hold")
    .lt("created_at", cutoff);

  for (const hold of holds ?? []) {
    if (hold.booking_id) {
      await admin
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", hold.booking_id)
        .eq("status", "pending_payment");
    }
    await admin.from("availability_blocks").delete().eq("id", hold.id);
  }

  console.log(
    JSON.stringify({ level: "info", event: "holds.released", count: holds?.length ?? 0 }),
  );
  return new Response(JSON.stringify({ released: holds?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
