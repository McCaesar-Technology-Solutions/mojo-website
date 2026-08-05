import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OpsAlert, OpsEmpty, OpsPageHeader, OpsPanel } from "@/components/admin/ops-ui";
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

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for audit logs.");
      return;
    }
    void adminListAuditLogs()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <OpsPageHeader title="Audit log" description="Admin actions for accountability." />
      {error && <OpsAlert>{error}</OpsAlert>}
      {items.length === 0 ? (
        <OpsEmpty>No audit events yet.</OpsEmpty>
      ) : (
        <OpsPanel className="divide-y divide-brand-900/8">
          {items.map((a) => (
            <div key={a.id} className="px-4 py-3 text-[13px]">
              <span className="font-medium">{a.action}</span>
              <span className="text-brand-900/50">
                {" "}
                · {a.entity_type}
                {a.entity_id ? ` · ${a.entity_id.slice(0, 8)}` : ""} ·{" "}
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </OpsPanel>
      )}
    </div>
  );
}
