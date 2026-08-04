import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApproveEnquiry, adminDeclineEnquiry, adminListEnquiries } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate, ghs } from "@/lib/format";
import type { Enquiry } from "@/types/domain";

export const Route = createFileRoute("/admin/enquiries")({
  head: () => ({ meta: [{ title: "Enquiries | Admin" }] }),
  component: AdminEnquiriesPage,
});

function AdminEnquiriesPage() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    adminListEnquiries()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for enquiries inbox.");
      return;
    }
    void reload();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-light">Enquiries</h1>
      <p className="text-sm text-gray-600">Approve to create a booking and block the calendar.</p>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}
      <div className="mt-6 space-y-3">
        {items.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5">
            <div className="flex justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">
                  {(e.property as { title?: string } | null)?.title ?? e.property_id}
                </p>
                <p className="text-sm text-gray-500">
                  {e.full_name} · {e.email} · {e.phone}
                </p>
                <p className="text-sm text-gray-500">
                  {fmtDate(e.check_in)} — {fmtDate(e.check_out)} · {e.guests} guests ·{" "}
                  {ghs(e.total)}
                </p>
                {e.notes && <p className="mt-2 text-sm">{e.notes}</p>}
              </div>
              <div className="text-right space-y-2">
                <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-lavender text-royal">
                  {e.status}
                </span>
                {["new", "in_review"].includes(e.status) && (
                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-3 py-1.5 rounded-full bg-royal text-white text-xs"
                      onClick={() =>
                        void adminApproveEnquiry(e.id)
                          .then(() => reload())
                          .catch((err) => setError(err.message))
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-full border text-xs"
                      onClick={() => {
                        const reason = window.prompt("Decline reason") ?? "Unavailable";
                        void adminDeclineEnquiry(e.id, reason)
                          .then(() => reload())
                          .catch((err) => setError(err.message));
                      }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
