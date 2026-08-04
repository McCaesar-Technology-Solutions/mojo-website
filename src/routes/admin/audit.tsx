import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
    <div>
      <h1 className="text-2xl font-light">Audit log</h1>
      <p className="text-sm text-gray-600">Admin actions for accountability.</p>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}
      <div className="mt-6 space-y-2">
        {items.map((a) => (
          <div key={a.id} className="bg-white rounded-xl p-3 text-sm ring-1 ring-brand-900/5">
            <span className="font-medium">{a.action}</span> · {a.entity_type}{" "}
            {a.entity_id ? `· ${a.entity_id.slice(0, 8)}` : ""} ·{" "}
            {new Date(a.created_at).toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  );
}
