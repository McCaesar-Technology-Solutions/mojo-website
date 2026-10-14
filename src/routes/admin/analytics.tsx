import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OpsAlert, OpsPageHeader } from "@/components/admin/ops-ui";
import { adminOpsMetrics } from "@/lib/admin";
import { enquiryConversionPercent } from "@/lib/review-stats";
import { getSupabase } from "@/lib/supabase/client";
import { ghs } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics | Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const [stats, setStats] = useState<{
    enquiries: number;
    conversion: number;
    revenue: number;
    nightsBooked: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for analytics.");
      return;
    }
    void adminOpsMetrics()
      .then((metrics) => {
        setStats({
          enquiries: metrics.enquiries,
          conversion: enquiryConversionPercent(metrics.approvedEnquiries, metrics.enquiries),
          revenue: metrics.revenue,
          nightsBooked: metrics.nightsBooked,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics."));
  }, []);

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Analytics"
        description="Enquiry conversion, nights booked, confirmed revenue."
      />
      {error && <OpsAlert>{error}</OpsAlert>}
      {!stats && !error ? (
        <p className="text-[13px] text-brand-900/55">Loading analytics.</p>
      ) : null}
      {stats ? (
        <div className="grid grid-cols-2 divide-x divide-brand-900/10 border border-brand-900/10 bg-white sm:grid-cols-4">
          {[
            { l: "Enquiries", v: String(stats.enquiries) },
            { l: "Enquiry conversion", v: `${stats.conversion}%` },
            { l: "Nights booked", v: String(stats.nightsBooked) },
            { l: "Revenue", v: ghs(stats.revenue) },
          ].map((c) => (
            <div key={c.l} className="px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-brand-900/45">
                {c.l}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.02em] tabular-nums">{c.v}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
