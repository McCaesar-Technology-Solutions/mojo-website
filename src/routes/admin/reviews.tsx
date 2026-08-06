import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import type { Review, ReviewStatus } from "@/types/domain";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews | Admin" }] }),
  component: AdminReviewsPage,
});

type Tab = "pending" | "all" | ReviewStatus;

const tabs: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = () =>
    adminListReviews()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for review moderation.");
      return;
    }
    void reload();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    if (tab === "pending") return items.filter((r) => r.status === "pending");
    return items.filter((r) => r.status === tab);
  }, [items, tab]);

  const moderate = (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    setError(null);
    void adminModerateReview(id, status)
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "Moderation failed"))
      .finally(() => setBusyId(null));
  };

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Reviews"
        description="Moderate guest reviews before they go public."
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-brand-900/10">
        {tabs.map((t) => {
          const count =
            t.id === "all"
              ? items.length
              : t.id === "pending"
                ? items.filter((r) => r.status === "pending").length
                : items.filter((r) => r.status === t.id).length;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition",
                active
                  ? "border-royal font-semibold text-royal"
                  : "border-transparent text-brand-900/55 hover:text-brand-900",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  active ? "bg-royal/10 text-royal" : "bg-brand-900/5 text-brand-900/45",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && <OpsAlert>{error}</OpsAlert>}
      {filtered.length === 0 ? (
        <OpsEmpty>No reviews in this view.</OpsEmpty>
      ) : (
        <OpsPanel className="divide-y divide-brand-900/8">
          {filtered.map((r) => (
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
              {r.status === "pending" ? (
                <div className="flex gap-2">
                  <OpsPrimaryButton
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => moderate(r.id, "approved")}
                  >
                    Approve
                  </OpsPrimaryButton>
                  <OpsSecondaryButton
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => moderate(r.id, "rejected")}
                  >
                    Reject
                  </OpsSecondaryButton>
                </div>
              ) : null}
            </div>
          ))}
        </OpsPanel>
      )}
    </div>
  );
}
