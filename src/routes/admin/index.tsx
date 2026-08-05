import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminDashboardStats } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { ghs } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin | MOJO" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    publishedProperties: 0,
    newEnquiries: 0,
    bookings: 0,
    revenue: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getSupabase()) {
      setError("Unable to load admin stats. Check your session and try again.");
      return;
    }
    void adminDashboardStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const cards = [
    {
      label: "Published properties",
      value: String(stats.publishedProperties),
      to: "/admin/properties",
    },
    { label: "New enquiries", value: String(stats.newEnquiries), to: "/admin/enquiries" },
    { label: "Bookings", value: String(stats.bookings), to: "/admin/bookings" },
    { label: "Confirmed revenue", value: ghs(stats.revenue), to: "/admin/analytics" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-light">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Content + enquiries ops overview.</p>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5 hover:shadow-md transition"
          >
            <p className="text-xs uppercase tracking-wider text-gray-500">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
