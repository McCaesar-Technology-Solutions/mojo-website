import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsPageHeader,
  OpsPanel,
  OpsStatus,
  enquiryTone,
} from "@/components/admin/ops-ui";
import { adminDashboardStats, adminListEnquiries } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate, ghs } from "@/lib/format";
import type { Enquiry } from "@/types/domain";

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
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getSupabase()) {
      setError("Unable to load admin stats. Check your session and try again.");
      return;
    }
    void Promise.all([adminDashboardStats(), adminListEnquiries()])
      .then(([s, list]) => {
        setStats(s);
        setEnquiries(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const openQueue = useMemo(
    () => enquiries.filter((e) => ["new", "in_review"].includes(e.status)),
    [enquiries],
  );

  return (
    <div className="space-y-5">
      <OpsPageHeader
        title="Shift board"
        description="Open requests first. Everything else is secondary."
        actions={
          <Link
            to="/admin/enquiries"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-royal px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-royal/90"
          >
            <iconify-icon icon="solar:inbox-linear" width="14" />
            Enquiry inbox
            {stats.newEnquiries > 0 ? (
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] tabular-nums">
                {stats.newEnquiries}
              </span>
            ) : null}
          </Link>
        }
      />

      {error && <OpsAlert>{error}</OpsAlert>}

      <OpsPanel>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-900/10 px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Needs action</h2>
            <p className="text-[12px] text-brand-900/50">
              {openQueue.length} open · {stats.bookings} bookings · {ghs(stats.revenue)} confirmed
            </p>
          </div>
          <Link
            to="/admin/enquiries"
            className="text-[12px] font-medium text-royal hover:underline"
          >
            Open inbox
          </Link>
        </div>
        {openQueue.length === 0 ? (
          <OpsEmpty>No open enquiries. Inbox is clear.</OpsEmpty>
        ) : (
          <ul className="divide-y divide-brand-900/8">
            {openQueue.map((e) => (
              <li key={e.id}>
                <Link
                  to="/admin/enquiries"
                  search={{ focus: e.id }}
                  className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 transition hover:bg-lavender/30 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{e.full_name}</p>
                    <p className="truncate text-[12px] text-brand-900/50">
                      {(e.property as { title?: string } | null)?.title ?? e.property_id}
                    </p>
                  </div>
                  <p className="hidden truncate text-[12px] text-brand-900/55 sm:block">
                    {fmtDate(e.check_in)} → {fmtDate(e.check_out)} · {e.guests} guests
                  </p>
                  <OpsStatus status={e.status} tone={enquiryTone(e.status)} />
                  <p className="text-right text-[13px] font-semibold tabular-nums">
                    {ghs(e.total)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </OpsPanel>

      <p className="text-[12px] text-brand-900/45">
        Also:{" "}
        <Link to="/admin/properties" className="text-royal hover:underline">
          {stats.publishedProperties} published stays
        </Link>
        {" · "}
        <Link to="/admin/bookings" className="text-royal hover:underline">
          bookings
        </Link>
        {" · "}
        <Link to="/admin/analytics" className="text-royal hover:underline">
          analytics
        </Link>
      </p>
    </div>
  );
}
