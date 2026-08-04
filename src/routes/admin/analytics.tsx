import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
    <div>
      <h1 className="text-2xl font-light">Analytics</h1>
      <p className="text-sm text-gray-600">
        Occupancy proxy, enquiry conversion, confirmed revenue.
      </p>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Enquiries", v: String(stats.enquiries) },
          { l: "Enquiry conversion", v: `${stats.conversion}%` },
          { l: "Nights booked", v: String(stats.nightsBooked) },
          { l: "Revenue", v: ghs(stats.revenue) },
        ].map((c) => (
          <div key={c.l} className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5">
            <p className="text-xs uppercase tracking-wider text-gray-500">{c.l}</p>
            <p className="mt-2 text-2xl font-semibold">{c.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
