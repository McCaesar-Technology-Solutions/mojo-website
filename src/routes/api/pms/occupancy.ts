import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { requireServiceSupabase } from "@/lib/supabase/server";

const blockSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reservationId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const bodySchema = z.object({
  propertyId: z.string().uuid(),
  blocks: z.array(blockSchema).max(2000),
});

function authorizePms(request: Request): boolean {
  const secret = process.env.PMS_SYNC_SECRET?.trim() ?? "";
  if (secret.length < 16) return false;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (auth.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  } catch {
    return false;
  }
}

function occupancyRpcFailure(message: string | undefined): {
  status: number;
  error: string;
  code: string;
} {
  const text = message ?? "";
  if (text.includes("OCCUPANCY_NOT_FOUND")) {
    return { status: 404, error: "Property not found.", code: "NOT_FOUND" };
  }
  if (text.includes("OCCUPANCY_INVALID") || text.includes("OCCUPANCY_OVERLAP")) {
    return { status: 400, error: "Invalid occupancy payload.", code: "INVALID" };
  }
  return { status: 500, error: "Occupancy replace failed.", code: "REPLACE_FAILED" };
}

export const Route = createFileRoute("/api/pms/occupancy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorizePms(request)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON." }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid payload.", code: "INVALID" },
            { status: 400 },
          );
        }

        for (const block of parsed.data.blocks) {
          if (block.endDate <= block.startDate) {
            return Response.json(
              { error: "Each block must have endDate after startDate.", code: "INVALID" },
              { status: 400 },
            );
          }
        }

        const { propertyId, blocks } = parsed.data;
        const supabase = requireServiceSupabase();
        const { data, error } = await supabase.rpc("replace_pms_occupancy", {
          p_property_id: propertyId,
          p_blocks: blocks,
        });

        if (error) {
          console.error(
            JSON.stringify({
              level: "error",
              event: "pms.occupancy.replace_failed",
              propertyId,
              code: error.code ?? null,
            }),
          );
          const mapped = occupancyRpcFailure(error.message);
          return Response.json(
            { error: mapped.error, code: mapped.code },
            { status: mapped.status },
          );
        }

        const result = data as { ok?: boolean; propertyId?: string; blocks?: number } | null;
        return Response.json({
          ok: true,
          propertyId: result?.propertyId ?? propertyId,
          blocks: result?.blocks ?? blocks.length,
        });
      },
    },
  },
});
