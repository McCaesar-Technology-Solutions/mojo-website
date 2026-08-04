import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListReviews, adminModerateReview } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import type { Review } from "@/types/domain";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews | Admin" }] }),
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    adminListReviews()
      .then(setItems)
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for review moderation.");
      return;
    }
    void reload();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-light">Reviews</h1>
      <p className="text-sm text-gray-600">Moderate guest reviews before they go public.</p>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}
      <div className="mt-6 space-y-3">
        {items.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5">
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-medium">
                  {(r as Review & { property?: { title: string } }).property?.title ??
                    r.property_id}
                </p>
                <p className="text-sm text-gold">{"★".repeat(r.rating)}</p>
                <p className="mt-2 text-sm text-gray-700">{r.body}</p>
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase">{r.status}</span>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-full bg-royal text-white text-xs"
                      onClick={() => void adminModerateReview(r.id, "approved").then(reload)}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1 rounded-full border text-xs"
                      onClick={() => void adminModerateReview(r.id, "rejected").then(reload)}
                    >
                      Reject
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
