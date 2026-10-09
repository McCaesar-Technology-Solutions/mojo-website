import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsInput,
  OpsPageHeader,
  OpsPanel,
  OpsPrimaryButton,
  OpsSelect,
  OpsStatus,
} from "@/components/admin/ops-ui";
import {
  adminCreateBlock,
  adminDeleteBlock,
  adminListBlocks,
  adminListProperties,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/domain";

export const Route = createFileRoute("/admin/calendar")({
  head: () => ({ meta: [{ title: "Calendar | Admin" }] }),
  component: AdminCalendarPage,
});

type Block = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  property?: { title: string } | null;
};

function AdminCalendarPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState<"manual" | "hold">("manual");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [props, bl] = await Promise.all([
      adminListProperties(),
      adminListBlocks(propertyId || undefined),
    ]);
    setProperties(props);
    setBlocks(bl as Block[]);
  };

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for calendar.");
      return;
    }
    void reload().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [propertyId]);

  const days = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const cells: { date: string; label: number }[] = [];
    for (let d = 1; d <= last.getDate(); d++) {
      const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date, label: d });
    }
    const pad = first.getDay();
    return { pad, cells };
  }, [month]);

  const isBlocked = (date: string) =>
    blocks.some(
      (b) =>
        (!propertyId || b.property_id === propertyId) && b.start_date <= date && date < b.end_date,
    );

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Calendar"
        description="Month view with manual/hold blocks. Booked dates come from approved enquiries — cancel the booking to free them."
      />
      {error && <OpsAlert>{error}</OpsAlert>}

      <OpsPanel className="grid gap-3 p-4 md:grid-cols-3">
        <label className="text-[12px] font-medium text-brand-900/60">
          Property filter
          <OpsSelect
            className="mt-1"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </OpsSelect>
        </label>
        <label className="text-[12px] font-medium text-brand-900/60">
          Month
          <OpsInput
            type="month"
            className="mt-1"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </OpsPanel>

      <OpsPanel className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-900/40"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: days.pad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.cells.map((c) => (
            <div
              key={c.date}
              title={c.date}
              className={cn(
                "flex aspect-square items-center justify-center border text-[13px] tabular-nums",
                isBlocked(c.date)
                  ? "border-royal bg-royal text-white"
                  : "border-brand-900/8 bg-white text-brand-900/80",
              )}
            >
              {c.label}
            </div>
          ))}
        </div>
      </OpsPanel>

      <OpsPanel className="p-4">
        <form
          className="grid gap-3 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!propertyId || !start || !end) {
              setError("Select property and dates");
              return;
            }
            if (end <= start) {
              setError("End date must be after start date");
              return;
            }
            const conflict = blocks.some(
              (b) => b.property_id === propertyId && start < b.end_date && b.start_date < end,
            );
            if (conflict) {
              setError("Conflict: overlapping block exists for those dates.");
              return;
            }
            setBusy(true);
            setError(null);
            void adminCreateBlock({
              property_id: propertyId,
              start_date: start,
              end_date: end,
              reason,
            })
              .then(() => {
                setStart("");
                setEnd("");
                return reload();
              })
              .catch((err) => setError(err instanceof Error ? err.message : "Block failed"))
              .finally(() => setBusy(false));
          }}
        >
          <h2 className="text-[14px] font-semibold md:col-span-5">Add block</h2>
          <OpsSelect required value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">Property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </OpsSelect>
          <OpsInput type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
          <OpsInput type="date" required value={end} onChange={(e) => setEnd(e.target.value)} />
          <OpsSelect
            value={reason}
            onChange={(e) => setReason(e.target.value as "manual" | "hold")}
          >
            <option value="manual">manual</option>
            <option value="hold">hold</option>
          </OpsSelect>
          <OpsPrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Block dates"}
          </OpsPrimaryButton>
        </form>
      </OpsPanel>

      {blocks.length === 0 ? (
        <OpsEmpty>No blocks for this filter.</OpsEmpty>
      ) : (
        <OpsPanel className="divide-y divide-brand-900/8">
          {blocks.map((b) => {
            const canDelete = b.reason === "manual" || b.reason === "hold";
            return (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{b.property?.title ?? b.property_id}</span>
                    <OpsStatus
                      status={b.reason}
                      tone={
                        b.reason === "booked" ? "ok" : b.reason === "hold" ? "review" : "neutral"
                      }
                    />
                  </div>
                  <p className="mt-0.5 text-brand-900/50">
                    {b.start_date} → {b.end_date}
                    {b.reason === "booked" ? " · cancel the booking to free these dates" : null}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="text-[12px] font-medium text-rose-800 hover:underline disabled:opacity-50"
                    onClick={() => {
                      const ok = window.confirm("Delete this calendar block?");
                      if (!ok) return;
                      setBusy(true);
                      setError(null);
                      void adminDeleteBlock(b)
                        .then(() => reload())
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : "Delete failed"),
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            );
          })}
        </OpsPanel>
      )}
    </div>
  );
}
