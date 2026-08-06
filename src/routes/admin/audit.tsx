import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsInput,
  OpsPageHeader,
  OpsPanel,
} from "@/components/admin/ops-ui";
import { adminListAuditLogs } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import type { AuditLog } from "@/types/domain";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit | Admin" }] }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for audit logs.");
      return;
    }
    void adminListAuditLogs()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((a) => {
      const meta = JSON.stringify(a.meta ?? {});
      return [a.action, a.entity_type, a.entity_id ?? "", meta]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query]);

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Audit log"
        description="Admin actions for accountability across inventory, enquiries, and messaging."
        actions={
          <OpsInput
            className="w-full min-w-[200px] sm:w-64"
            value={query}
            placeholder="Filter actions…"
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      />
      {error && <OpsAlert>{error}</OpsAlert>}
      {filtered.length === 0 ? (
        <OpsEmpty>No audit events yet.</OpsEmpty>
      ) : (
        <OpsPanel className="divide-y divide-brand-900/8">
          {filtered.map((a) => {
            const metaKeys = Object.keys(a.meta ?? {});
            return (
              <div key={a.id} className="px-4 py-3 text-[13px]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p>
                    <span className="font-medium">{a.action}</span>
                    <span className="text-brand-900/50">
                      {" "}
                      · {a.entity_type}
                      {a.entity_id ? ` · ${a.entity_id.slice(0, 8)}` : ""}
                    </span>
                  </p>
                  <p className="text-[12px] text-brand-900/45">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                {metaKeys.length > 0 ? (
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-brand-900/45">
                    {metaKeys
                      .slice(0, 6)
                      .map((k) => `${k}=${JSON.stringify((a.meta as Record<string, unknown>)[k])}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
            );
          })}
        </OpsPanel>
      )}
    </div>
  );
}
