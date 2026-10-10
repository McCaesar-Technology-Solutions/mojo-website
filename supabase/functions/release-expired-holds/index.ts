// Cron: release payment holds older than 30 minutes and cancel pending bookings
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: holds, error: holdsError } = await admin
    .from("availability_blocks")
    .select("id")
    .eq("reason", "hold")
    .lt("created_at", cutoff);
  if (holdsError) {
    return new Response("hold lookup failed", { status: 500 });
  }

  let released = 0;
  for (const hold of holds ?? []) {
    const { data, error } = await admin.rpc("release_expired_payment_hold", {
      p_block_id: hold.id,
    });
    if (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "holds.release_failed",
          blockId: hold.id,
        }),
      );
      return new Response("release failed", { status: 500 });
    }
    if (data?.outcome === "released") released += 1;
  }

  console.log(JSON.stringify({ level: "info", event: "holds.released", count: released }));
  return new Response(JSON.stringify({ released }), {
    headers: { "Content-Type": "application/json" },
  });
});
