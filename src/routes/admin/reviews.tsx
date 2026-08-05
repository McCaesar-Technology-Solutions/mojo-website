import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsPageHeader,
  OpsPanel,
  OpsPrimaryButton,
  OpsSecondaryButton,
  OpsStatus,
} from "@/components/admin/ops-ui";
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
    <div className="space-y-4">
      <OpsPageHeader
        title="Reviews"
        description="Moderate guest reviews before they go public."
      />
      {error && <OpsAlert>{error}</OpsAlert>}
      {items.length === 0 ? (
        <OpsEmpty>No reviews to moderate.</OpsEmpty>
      ) : (
        <OpsPanel className="divide-y divide-brand-900/8">
          {items.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-4 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[13px]">
                    {(r as Review & { property?: { title: string } }).property?.title ??
                      r.property_id}
                  </p>
                  <OpsStatus
                    status={r.status}
                    tone={
                      r.status === "approved" ? "ok" : r.status === "rejected" ? "bad" : "review"
                    }
                  />
                </div>
                <p className="mt-1 text-[12px] text-gold">{"★".repeat(r.rating)}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-brand-900/75">{r.body}</p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <OpsPrimaryButton
                    type="button"
                    onClick={() => void adminModerateReview(r.id, "approved").then(reload)}
                  >
                    Approve
                  </OpsPrimaryButton>
                  <OpsSecondaryButton
                    type="button"
                    onClick={() => void adminModerateReview(r.id, "rejected").then(reload)}
                  >
                    Reject
                  </OpsSecondaryButton>
                </div>
              )}
            </div>
          ))}
        </OpsPanel>
      )}
    </div>
  );
}
