import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsInput,
  OpsPageHeader,
  OpsPanel,
  OpsSecondaryButton,
  OpsTextarea,
} from "@/components/admin/ops-ui";
import { adminListAuditLogs, adminListUnresolvedLatePayments } from "@/lib/admin";
import {
  adminReconcileLatePayment,
  adminRecordRefundVerification,
  type ManualRefundOutcome,
} from "@/lib/paystack-refund-admin";
import { getSupabase } from "@/lib/supabase/client";
import type { AuditLog } from "@/types/domain";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit | Admin" }] }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [latePayments, setLatePayments] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refundNotice, setRefundNotice] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [verifyOutcome, setVerifyOutcome] = useState<"" | ManualRefundOutcome>("");
  const [verifyReference, setVerifyReference] = useState("");
  const [verifyEvidence, setVerifyEvidence] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for audit logs.");
      return;
    }
    void adminListAuditLogs()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    void adminListUnresolvedLatePayments()
      .then(setLatePayments)
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
      {latePayments.length > 0 ? (
        <OpsPanel className="px-4 py-3 text-[13px]">
          <p className="font-medium">Unresolved late payments</p>
          <p className="mt-1 text-brand-900/60">
            A charge needs reconciliation. Refund sends one Paystack refund from the server, then
            releases the calendar only after that cleanup commits. If the refund is stuck as pending,
            check the Paystack dashboard and record what you see. Unknown leaves it pending and does
            not send another refund. Accepted is stored only with the matching reference and a note.
          </p>
          {refundNotice && <p className="mt-2 text-brand-900/80">{refundNotice}</p>}
          <ul className="mt-2 space-y-2 font-mono text-[11px]">
            {latePayments.map((a) => {
              const reference = String((a.meta as { reference?: string }).reference ?? "");
              const unmatched = a.action === "booking.payment_unmatched";
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <span>
                    {unmatched ? "No local booking" : a.entity_id} · {reference}
                  </span>
                  {unmatched || !a.entity_id ? null : (
                    <div className="flex w-full flex-col gap-2 font-sans">
                      <OpsSecondaryButton
                        type="button"
                        disabled={refundingId !== null}
                        onClick={() => {
                          setRefundingId(a.id);
                          setRefundNotice(null);
                          void adminReconcileLatePayment(a.entity_id as string)
                            .then(() => {
                              setRefundNotice("Refund recorded and the calendar was released.");
                              setLatePayments((rows) => rows.filter((row) => row.entity_id !== a.entity_id));
                            })
                            .catch((e) =>
                              setRefundNotice(e instanceof Error ? e.message : "Refund was not completed."),
                            )
                            .finally(() => setRefundingId(null));
                        }}
                      >
                        {refundingId === a.id ? "Working…" : "Refund and release calendar"}
                      </OpsSecondaryButton>
                      {verifyId === a.id ? (
                        <form
                          className="space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            if (verifyOutcome !== "accepted" && verifyOutcome !== "unknown") {
                              setRefundNotice("Choose whether the dashboard shows the refund as accepted or still unknown.");
                              return;
                            }
                            setRefundingId(a.id);
                            setRefundNotice(null);
                            void adminRecordRefundVerification({
                              bookingId: a.entity_id as string,
                              outcome: verifyOutcome,
                              reference: verifyReference,
                              evidence: verifyEvidence,
                            })
                              .then((result) => {
                                if (result.occupancyReleased) {
                                  setRefundNotice("Verified refund recorded and the calendar was released.");
                                  setLatePayments((rows) => rows.filter((row) => row.entity_id !== a.entity_id));
                                } else {
                                  setRefundNotice("Recorded as unknown. The refund stays pending and no new refund was sent.");
                                }
                                setVerifyId(null);
                                setVerifyOutcome("");
                                setVerifyReference("");
                                setVerifyEvidence("");
                              })
                              .catch((e) =>
                                setRefundNotice(e instanceof Error ? e.message : "The verification was not recorded."),
                              )
                              .finally(() => setRefundingId(null));
                          }}
                        >
                          <label className="block text-[12px] text-brand-900/70">
                            Dashboard result
                            <select
                              className="mt-1 w-full rounded-lg border border-brand-900/15 bg-white px-2 py-1.5 text-[13px]"
                              value={verifyOutcome}
                              onChange={(e) => setVerifyOutcome(e.target.value as "" | ManualRefundOutcome)}
                            >
                              <option value="">Select what you verified</option>
                              <option value="accepted">Paystack shows this refund succeeded</option>
                              <option value="unknown">Paystack does not show a confirmed refund</option>
                            </select>
                          </label>
                          <OpsInput
                            value={verifyReference}
                            placeholder="Paystack reference from the dashboard"
                            onChange={(e) => setVerifyReference(e.target.value)}
                          />
                          <OpsTextarea
                            value={verifyEvidence}
                            placeholder="What you saw: refund id, amount, and time"
                            onChange={(e) => setVerifyEvidence(e.target.value)}
                          />
                          <OpsSecondaryButton type="submit" disabled={refundingId !== null}>
                            Record verification
                          </OpsSecondaryButton>
                        </form>
                      ) : (
                        <button
                          type="button"
                          className="text-left text-[12px] text-brand-900/70 underline"
                          onClick={() => {
                            setVerifyId(a.id);
                            setVerifyOutcome("");
                            setVerifyReference(reference);
                            setVerifyEvidence("");
                            setRefundNotice(null);
                          }}
                        >
                          Record a dashboard check
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </OpsPanel>
      ) : null}
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
