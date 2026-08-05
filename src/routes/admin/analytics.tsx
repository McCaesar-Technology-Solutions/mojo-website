import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OpsAlert, OpsPageHeader } from "@/components/admin/ops-ui";
import { adminListBookings, adminListEnquiries } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { ghs } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics | Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    enquiries: 0,
    approved: 0,
    conversion: 0,
    revenue: 0,
    nightsBooked: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for analytics.");
      return;
    }
    void Promise.all([adminListEnquiries(), adminListBookings()])
      .then(([enquiries, bookings]) => {
        const approved = enquiries.filter((e) => e.status === "approved").length;
        const confirmed = bookings.filter((b) =>
          ["confirmed", "checked_in", "completed"].includes(b.status),
        );
        setStats({
          enquiries: enquiries.length,
          approved,
          conversion: enquiries.length ? Math.round((approved / enquiries.length) * 100) : 0,
          revenue: confirmed.reduce((s, b) => s + Number(b.total), 0),
          nightsBooked: confirmed.reduce((s, b) => s + Number(b.nights), 0),
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Analytics"
        description="Enquiry conversion, nights booked, confirmed revenue."
      />
      {error && <OpsAlert>{error}</OpsAlert>}
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
    </div>
  );
}
