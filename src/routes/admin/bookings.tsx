import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsPageHeader,
  OpsPanel,
  OpsSelect,
  OpsTextarea,
} from "@/components/admin/ops-ui";
import { adminListBookings, adminRefundBooking, adminUpdateBooking } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate, ghs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types/domain";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings | Admin" }] }),
  component: AdminBookingsPage,
});

function AdminBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "in_stay" | "completed" | "cancelled">(
    "all",
  );
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const reload = () =>
    adminListBookings()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for bookings board.");
      return;
    }
    void reload();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (filter === "all") return true;
      if (filter === "upcoming") return b.check_in > today && b.status === "confirmed";
      if (filter === "in_stay")
        return (
          b.check_in <= today &&
          b.check_out > today &&
          ["confirmed", "checked_in"].includes(b.status)
        );
      if (filter === "completed") return b.status === "completed" || b.check_out <= today;
      if (filter === "cancelled") return ["cancelled", "refunded"].includes(b.status);
      return true;
    });
  }, [items, filter, today]);

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Bookings"
        description="Confirmed stays from approved requests. Update status and notes as the stay progresses."
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-brand-900/10">
        {(["all", "upcoming", "in_stay", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] capitalize transition",
              filter === f
                ? "border-royal font-semibold text-royal"
                : "border-transparent text-brand-900/55 hover:text-brand-900",
            )}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && <OpsAlert>{error}</OpsAlert>}

      {filtered.length === 0 ? (
        <OpsEmpty>No bookings in this view.</OpsEmpty>
      ) : (
        <OpsPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-b border-brand-900/10 bg-[#FBFaf7] text-[11px] uppercase tracking-[0.06em] text-brand-900/45">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Guest</th>
                  <th className="px-4 py-2.5 font-semibold">Stay</th>
                  <th className="px-4 py-2.5 font-semibold">Total</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/8">
                {filtered.map((b) => (
                  <tr key={b.id} className="align-top hover:bg-lavender/25">
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.guest_name}</p>
                      <p className="text-[12px] text-brand-900/50">{b.guest_email}</p>
                      <p className="mt-1 text-[12px] text-brand-900/45">
                        {(b.property as { title?: string } | null)?.title ?? b.property_id}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-brand-900/70">
                      {fmtDate(b.check_in)} → {fmtDate(b.check_out)}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{ghs(b.total)}</td>
                    <td className="px-4 py-3">
                      <OpsSelect
                        className="max-w-[160px]"
                        value={b.status}
                        onChange={(e) =>
                          void adminUpdateBooking(b.id, {
                            status: e.target.value as BookingStatus,
                          })
                            .then(() => reload())
                            .catch((err) => setError(err.message))
                        }
                      >
                        {[
                          "pending_payment",
                          "confirmed",
                          "checked_in",
                          "completed",
                          "cancelled",
                          "refunded",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </OpsSelect>
                      {b.paystack_reference && b.status === "confirmed" && (
                        <button
                          type="button"
                          className="mt-2 block text-[11px] text-rose-800 underline"
                          onClick={() =>
                            void adminRefundBooking(b.id)
                              .then(() => reload())
                              .catch((err) => setError(err.message))
                          }
                        >
                          Refund via Paystack
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OpsTextarea
                        className="min-h-[64px] min-w-[180px]"
                        placeholder="Admin notes"
                        defaultValue={b.admin_notes ?? ""}
                        onBlur={(e) =>
                          void adminUpdateBooking(b.id, { admin_notes: e.target.value }).catch(
                            (err) => setError(err.message),
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OpsPanel>
      )}
    </div>
  );
}
