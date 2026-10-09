import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsInput,
  OpsPageHeader,
  OpsPrimaryButton,
  OpsTextarea,
} from "@/components/admin/ops-ui";
import { adminListMessageThreads, adminReplyToThread } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import type { Message, MessageThread } from "@/types/domain";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Messages | Admin" }] }),
  component: AdminMessagesPage,
});

type AdminThread = MessageThread & {
  messages?: Message[];
  guest_profile?: { full_name: string | null; phone: string | null } | null;
  enquiry?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    property?: { title: string; slug: string } | null;
  } | null;
};

function AdminMessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () =>
    adminListMessageThreads()
      .then((list) => {
        setThreads(list as AdminThread[]);
        return list as AdminThread[];
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed");
        return [] as AdminThread[];
      });

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for messages inbox.");
      return;
    }
    void reload().then((list) => {
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    });
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return threads;
    return threads.filter((t) => {
      const hay = [
        t.guest_profile?.full_name ?? "",
        t.enquiry?.full_name ?? "",
        t.enquiry?.email ?? "",
        t.enquiry?.property?.title ?? "",
        ...(t.messages ?? []).map((m) => m.body),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [threads, query]);

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selected && !filtered.some((t) => t.id === selected.id)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selected]);

  const threadLabel = (t: AdminThread) =>
    t.guest_profile?.full_name ||
    t.enquiry?.full_name ||
    (t.guest_id ? `Guest ${t.guest_id.slice(0, 8)}` : "Thread");

  const reply = () => {
    if (!selected || !body.trim()) return;
    setBusy(true);
    setError(null);
    void adminReplyToThread(selected.id, body)
      .then(() => {
        setBody("");
        return reload();
      })
      .then((list) => {
        if (selectedId && list.some((t) => t.id === selectedId)) {
          setSelectedId(selectedId);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Reply failed"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[520px] flex-col gap-4">
      <OpsPageHeader
        title="Messages"
        description="Reply to guest threads linked to enquiries or bookings."
        actions={
          <OpsInput
            className="w-full min-w-[200px] sm:w-64"
            value={query}
            placeholder="Search threads…"
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      />

      {error && <OpsAlert>{error}</OpsAlert>}

      {filtered.length === 0 ? (
        <OpsEmpty>No message threads yet.</OpsEmpty>
      ) : (
        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden border border-brand-900/10 bg-white lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.3fr)]">
          <div className="min-h-0 overflow-y-auto border-b border-brand-900/10 lg:border-b-0 lg:border-r">
            <div className="sticky top-0 z-10 border-b border-brand-900/10 bg-[#FBFaf7] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                Threads · {filtered.length}
              </p>
            </div>
            <ul>
              {filtered.map((t) => {
                const active = selected?.id === t.id;
                const preview = t.messages?.[t.messages.length - 1]?.body ?? "No messages yet";
                return (
                  <li key={t.id} className="border-b border-brand-900/6 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        "w-full px-3 py-3 text-left transition",
                        active ? "bg-lavender/60" : "hover:bg-brand-900/[0.025]",
                      )}
                    >
                      <p className="truncate text-[13px] font-medium text-brand-900">
                        {threadLabel(t)}
                      </p>
                      <p className="truncate text-[12px] text-brand-900/50">
                        {t.enquiry?.property?.title ?? "General thread"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-brand-900/40">{preview}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected ? (
            <div className="flex min-h-0 flex-col">
              <div className="border-b border-brand-900/10 px-5 py-4">
                <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-brand-900">
                  {threadLabel(selected)}
                </h2>
                <p className="mt-1 text-[13px] text-brand-900/55">
                  {selected.enquiry?.property?.title ? `${selected.enquiry.property.title} · ` : ""}
                  {selected.enquiry?.email ?? selected.guest_profile?.phone ?? "No contact on file"}
                </p>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {(selected.messages ?? []).length === 0 ? (
                  <p className="text-[13px] text-brand-900/45">No messages in this thread yet.</p>
                ) : (
                  (selected.messages ?? []).map((m) => {
                    const fromAdmin = Boolean(user && m.sender_id === user.id);
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "max-w-[85%] px-3 py-2.5 text-[13px] leading-relaxed",
                          fromAdmin
                            ? "ml-auto bg-royal text-white"
                            : "bg-lavender/70 text-brand-900",
                        )}
                      >
                        <p>{m.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            fromAdmin ? "text-white/70" : "text-brand-900/45",
                          )}
                        >
                          {new Date(m.created_at).toLocaleString()}
                          {fromAdmin ? " · you" : " · guest"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                className="sticky bottom-0 border-t border-brand-900/10 bg-[#FBFaf7] px-5 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  reply();
                }}
              >
                <OpsTextarea
                  className="min-h-[72px]"
                  value={body}
                  placeholder="Write a reply…"
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                  <OpsPrimaryButton type="submit" disabled={busy || !body.trim()}>
                    {busy ? "Sending…" : "Send reply"}
                  </OpsPrimaryButton>
                </div>
              </form>
            </div>
          ) : (
            <OpsEmpty>Select a thread.</OpsEmpty>
          )}
        </div>
      )}
    </div>
  );
}
