import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminCreateBlock, adminListBlocks, adminListProperties } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
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
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [error, setError] = useState<string | null>(null);

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
    void reload().catch((e) => setError(e.message));
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
    // pad start for weekday alignment
    const pad = first.getDay();
    return { pad, cells };
  }, [month]);

  const isBlocked = (date: string) =>
    blocks.some(
      (b) =>
        (!propertyId || b.property_id === propertyId) && b.start_date <= date && date < b.end_date,
    );

  return (
    <div>
      <h1 className="text-2xl font-light">Calendar</h1>
      <p className="text-sm text-gray-600">
        Month view with manual blocks and conflict-aware holds.
      </p>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}

      <div className="mt-6 grid md:grid-cols-3 gap-4 bg-white rounded-2xl p-5 ring-1 ring-brand-900/5">
        <label className="text-sm">
          Property filter
          <select
            className="mt-1 w-full border rounded-xl p-2"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Month
          <input
            type="month"
            className="mt-1 w-full border rounded-xl p-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-xs text-gray-500 text-center py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: days.pad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.cells.map((c) => (
          <div
            key={c.date}
            className={`aspect-square rounded-xl border text-sm flex items-center justify-center ${
              isBlocked(c.date) ? "bg-royal text-white border-royal" : "bg-white"
            }`}
            title={c.date}
          >
            {c.label}
          </div>
        ))}
      </div>

      <form
        className="mt-8 bg-white rounded-2xl p-5 ring-1 ring-brand-900/5 grid md:grid-cols-4 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!propertyId || !start || !end) {
            setError("Select property and dates");
            return;
          }
          // simple conflict check
          const conflict = blocks.some(
            (b) => b.property_id === propertyId && start < b.end_date && b.start_date < end,
          );
          if (conflict) {
            setError("Conflict: overlapping block exists for those dates.");
            return;
          }
          void adminCreateBlock({
            property_id: propertyId,
            start_date: start,
            end_date: end,
            reason: "manual",
          })
            .then(() => reload())
            .catch((err) => setError(err.message));
        }}
      >
        <h2 className="md:col-span-4 font-medium">Add manual block</h2>
        <select
          required
          className="border rounded-xl p-2 text-sm"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          <option value="">Property</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          required
          className="border rounded-xl p-2 text-sm"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="date"
          required
          className="border rounded-xl p-2 text-sm"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button type="submit" className="rounded-full bg-royal text-white text-sm">
          Block dates
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {blocks.map((b) => (
          <div key={b.id} className="text-sm bg-white rounded-xl p-3 ring-1 ring-brand-900/5">
            {b.property?.title ?? b.property_id}: {b.start_date} → {b.end_date} ({b.reason})
          </div>
        ))}
      </div>
    </div>
  );
}
