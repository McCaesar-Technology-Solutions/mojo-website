import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminListBookings, adminRefundBooking, adminUpdateBooking } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate, ghs } from "@/lib/format";
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
    <div>
      <h1 className="text-2xl font-light">Bookings</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "upcoming", "in_stay", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              filter === f ? "bg-royal text-white border-royal" : "bg-white"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}
      <div className="mt-6 space-y-3">
        {filtered.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5">
            <div className="flex justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">
                  {(b.property as { title?: string } | null)?.title ?? b.property_id}
                </p>
                <p className="text-sm text-gray-500">
                  {b.guest_name} · {b.guest_email}
                </p>
                <p className="text-sm text-gray-500">
                  {fmtDate(b.check_in)} — {fmtDate(b.check_out)} · {ghs(b.total)}
                </p>
                <textarea
                  className="mt-2 w-full max-w-md border rounded-xl p-2 text-sm"
                  placeholder="Admin notes"
                  defaultValue={b.admin_notes ?? ""}
                  onBlur={(e) =>
                    void adminUpdateBooking(b.id, { admin_notes: e.target.value }).catch((err) =>
                      setError(err.message),
                    )
                  }
                />
              </div>
              <div className="space-y-2 text-right">
                <select
                  className="border rounded-xl px-2 py-1 text-sm"
                  value={b.status}
                  onChange={(e) =>
                    void adminUpdateBooking(b.id, { status: e.target.value as BookingStatus })
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
                </select>
                {b.paystack_reference && b.status === "confirmed" && (
                  <button
                    className="block ml-auto text-xs text-red-700 underline"
                    onClick={() =>
                      void adminRefundBooking(b.id)
                        .then(() => reload())
                        .catch((err) => setError(err.message))
                    }
                  >
                    Refund via Paystack
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
