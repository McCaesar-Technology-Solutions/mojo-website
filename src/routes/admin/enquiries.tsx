import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  OpsAlert,
  OpsEmpty,
  OpsField,
  OpsInput,
  OpsPageHeader,
  OpsPrimaryButton,
  OpsSecondaryButton,
  OpsStatus,
  OpsTextarea,
  enquiryTone,
} from "@/components/admin/ops-ui";
import {
  adminApproveEnquiry,
  adminDeclineEnquiry,
  adminListEnquiries,
  adminMarkEnquiryInReview,
  adminUpdateEnquiry,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate, ghs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Enquiry, EnquiryStatus } from "@/types/domain";

const searchSchema = z.object({
  focus: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/admin/enquiries")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Enquiries | Admin" }] }),
  component: AdminEnquiriesPage,
});

type Tab = "open" | "all" | EnquiryStatus;

const tabs: { id: Tab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "in_review", label: "In review" },
  { id: "approved", label: "Approved" },
  { id: "declined", label: "Declined" },
];

function AdminEnquiriesPage() {
  const { focus, q: qParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(qParam ?? "");
  const [adminNotes, setAdminNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  const reload = () =>
    adminListEnquiries()
      .then((list) => {
        setItems(list);
        return list;
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed");
        return [] as Enquiry[];
      });

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for enquiries inbox.");
      return;
    }
    void reload().then((list) => {
      if (focus && list.some((e) => e.id === focus)) {
        setSelectedId(focus);
        return;
      }
      const firstOpen = list.find((e) => ["new", "in_review"].includes(e.status));
      setSelectedId(firstOpen?.id ?? list[0]?.id ?? null);
    });
  }, [focus]);

  const counts = useMemo(() => {
    const open = items.filter((e) => ["new", "in_review"].includes(e.status)).length;
    const byStatus = (s: EnquiryStatus) => items.filter((e) => e.status === s).length;
    return {
      open,
      all: items.length,
      new: byStatus("new"),
      in_review: byStatus("in_review"),
      approved: byStatus("approved"),
      declined: byStatus("declined"),
      expired: byStatus("expired"),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = items;
    if (tab === "open") list = list.filter((e) => ["new", "in_review"].includes(e.status));
    else if (tab !== "all") list = list.filter((e) => e.status === tab);
    if (!needle) return list;
    return list.filter((e) => {
      const title = (e.property as { title?: string } | null)?.title ?? "";
      return [e.full_name, e.email, e.phone, title].join(" ").toLowerCase().includes(needle);
    });
  }, [items, tab, query]);

  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selected && !filtered.some((e) => e.id === selected.id)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selected]);

  useEffect(() => {
    setAdminNotes(selected?.admin_notes ?? "");
    setDeclineReason("");
  }, [selected?.id]);

  const nights = (e: Enquiry) => {
    const a = new Date(e.check_in).getTime();
    const b = new Date(e.check_out).getTime();
    return Math.max(1, Math.round((b - a) / 86400000));
  };

  const canAct = selected && ["new", "in_review"].includes(selected.status);

  const saveNotes = () => {
    if (!selected || !canAct) return;
    const next = adminNotes.trim();
    if ((selected.admin_notes ?? "") === next) return;
    void adminUpdateEnquiry(selected.id, { admin_notes: next || null })
      .then(() => reload())
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to save notes"));
  };

  const markInReview = () => {
    if (!selected || selected.status !== "new") return;
    setBusy(true);
    void adminMarkEnquiryInReview(selected.id)
      .then(() => reload())
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setBusy(false));
  };

  const decline = () => {
    if (!selected) return;
    const reason = declineReason.trim();
    if (!reason) {
      setError("Decline reason is required.");
      return;
    }
    setBusy(true);
    setError(null);
    void adminDeclineEnquiry(selected.id, reason)
      .then(() => {
        setDeclineReason("");
        return reload();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Decline failed"))
      .finally(() => setBusy(false));
  };

  const approve = () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    void adminApproveEnquiry(selected.id, adminNotes.trim() || undefined)
      .then(() => reload())
      .catch((err) => setError(err instanceof Error ? err.message : "Approve failed"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[520px] flex-col gap-4">
      <OpsPageHeader
        title="Enquiries"
        description="Approve creates a booking and blocks the calendar. Decline with a reason for the guest."
        actions={
          <div className="relative w-full min-w-[220px] sm:w-64">
            <iconify-icon
              icon="solar:magnifer-linear"
              width="14"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-900/40"
            />
            <OpsInput
              className="pl-8"
              value={query}
              placeholder="Search guest, email, property…"
              onChange={(e) => {
                const next = e.target.value;
                setQuery(next);
                void navigate({
                  search: (prev: { focus?: string; q?: string }) => ({
                    ...prev,
                    q: next || undefined,
                  }),
                });
              }}
            />
          </div>
        }
      />

      {error && <OpsAlert>{error}</OpsAlert>}

      <div className="flex flex-wrap items-center gap-1 border-b border-brand-900/10 pb-px">
        {tabs.map((t) => {
          const count =
            t.id === "open"
              ? counts.open
              : t.id === "all"
                ? counts.all
                : (counts[t.id as EnquiryStatus] ?? 0);
          const active = tab === t.id;
          const isNew = t.id === "new";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition",
                active
                  ? "border-royal font-semibold text-royal"
                  : "border-transparent text-brand-900/55 hover:text-brand-900",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  isNew
                    ? "bg-gold/20 text-brand-900 ring-1 ring-gold/40"
                    : active
                      ? "bg-royal/10 text-royal"
                      : "bg-brand-900/5 text-brand-900/45",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <OpsEmpty>No enquiries in this view.</OpsEmpty>
      ) : (
        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden border border-brand-900/10 bg-white lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.25fr)]">
          <div className="min-h-0 overflow-y-auto border-b border-brand-900/10 lg:border-b-0 lg:border-r">
            <div className="sticky top-0 z-10 border-b border-brand-900/10 bg-[#FBFaf7] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                Queue · {filtered.length}
              </p>
            </div>
            <ul>
              {filtered.map((e) => {
                const active = selected?.id === e.id;
                return (
                  <li key={e.id} className="border-b border-brand-900/6 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(e.id)}
                      className={cn(
                        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-3 py-3 text-left transition",
                        active ? "bg-lavender/60" : "hover:bg-brand-900/[0.025]",
                      )}
                    >
                      <OpsStatus status={e.status} tone={enquiryTone(e.status)} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-brand-900">
                          {e.full_name}
                        </p>
                        <p className="truncate text-[12px] text-brand-900/50">
                          {(e.property as { title?: string } | null)?.title ?? e.property_id}
                        </p>
                        <p className="truncate text-[11px] text-brand-900/40">
                          {fmtDate(e.check_in)} → {fmtDate(e.check_out)}
                        </p>
                      </div>
                      <p className="text-right text-[12px] font-semibold tabular-nums text-brand-900">
                        {ghs(e.total)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected ? (
            <div className="flex min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="border-b border-brand-900/10 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <OpsStatus status={selected.status} tone={enquiryTone(selected.status)} />
                        <span className="font-mono text-[11px] text-brand-900/40">
                          {selected.id.slice(0, 8)}
                        </span>
                      </div>
                      <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-brand-900">
                        {selected.full_name}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-brand-900/55">
                        {(selected.property as { title?: string } | null)?.title ??
                          selected.property_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/40">
                        Total
                      </p>
                      <p className="mt-1 text-[1.375rem] font-semibold tracking-[-0.02em] tabular-nums text-brand-900">
                        {ghs(selected.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 border-b border-brand-900/10 px-5 py-5 sm:grid-cols-3">
                  <OpsField label="Email">
                    <a className="text-royal hover:underline" href={`mailto:${selected.email}`}>
                      {selected.email}
                    </a>
                  </OpsField>
                  <OpsField label="Phone">
                    <a className="text-royal hover:underline" href={`tel:${selected.phone}`}>
                      {selected.phone}
                    </a>
                  </OpsField>
                  <OpsField label="Received">
                    {new Date(selected.created_at).toLocaleString()}
                  </OpsField>
                </div>

                <div className="border-b border-brand-900/10 px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                    Stay
                  </p>
                  <div className="mt-3 grid gap-px overflow-hidden border border-brand-900/10 bg-brand-900/10 sm:grid-cols-4">
                    {[
                      { label: "Check-in", value: fmtDate(selected.check_in) },
                      { label: "Check-out", value: fmtDate(selected.check_out) },
                      { label: "Nights", value: String(nights(selected)) },
                      { label: "Guests", value: String(selected.guests) },
                    ].map((cell) => (
                      <div key={cell.label} className="bg-white px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-900/40">
                          {cell.label}
                        </p>
                        <p className="mt-1 text-[13px] font-medium">{cell.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-0 border-b border-brand-900/10 sm:grid-cols-2">
                  <div className="border-b border-brand-900/10 px-5 py-5 sm:border-b-0 sm:border-r">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                      Pricing
                    </p>
                    <dl className="mt-3 space-y-2 text-[13px]">
                      <div className="flex justify-between gap-4">
                        <dt className="text-brand-900/55">Nightly</dt>
                        <dd className="tabular-nums">{ghs(selected.nightly_rate)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-brand-900/55">Cleaning</dt>
                        <dd className="tabular-nums">{ghs(selected.cleaning_fee)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-brand-900/55">Service fee</dt>
                        <dd className="tabular-nums">{ghs(selected.service_fee)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-brand-900/10 pt-2 font-semibold">
                        <dt>Total</dt>
                        <dd className="tabular-nums">{ghs(selected.total)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                      Guest notes
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-brand-900/75">
                      {selected.notes?.trim() || "No guest notes."}
                    </p>
                    {selected.decline_reason ? (
                      <p className="mt-3 text-[12px] text-rose-800">
                        Decline reason: {selected.decline_reason}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="px-5 py-5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                    Internal notes
                    <OpsTextarea
                      className="mt-2 min-h-[72px]"
                      value={adminNotes}
                      placeholder="Visible to the ops team only"
                      readOnly={!canAct}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      onBlur={saveNotes}
                    />
                  </label>
                  {canAct ? (
                    <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                      Decline reason (required to decline)
                      <OpsTextarea
                        className="mt-2 min-h-[56px]"
                        value={declineReason}
                        placeholder="Shared with the guest when declining"
                        onChange={(e) => setDeclineReason(e.target.value)}
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              {canAct ? (
                <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-brand-900/10 bg-[#FBFaf7] px-5 py-3">
                  {selected.status === "new" ? (
                    <OpsSecondaryButton type="button" disabled={busy} onClick={markInReview}>
                      Mark in review
                    </OpsSecondaryButton>
                  ) : null}
                  <OpsSecondaryButton type="button" disabled={busy} onClick={decline}>
                    Decline
                  </OpsSecondaryButton>
                  <OpsPrimaryButton type="button" disabled={busy} onClick={approve}>
                    Approve
                  </OpsPrimaryButton>
                </div>
              ) : null}
            </div>
          ) : (
            <OpsEmpty>Select an enquiry from the queue.</OpsEmpty>
          )}
        </div>
      )}
    </div>
  );
}
