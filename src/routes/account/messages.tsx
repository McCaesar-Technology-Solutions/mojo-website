import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { getWhatsAppNumber } from "@/lib/env";

export const Route = createFileRoute("/account/messages")({
  head: () => ({ meta: [{ title: "Messages | MOJO Apartments" }] }),
  component: MessagesPage,
});

type Thread = {
  id: string;
  created_at: string;
  messages?: { id: string; body: string; created_at: string }[];
};

function MessagesPage() {
  const { user } = useAuth();
  const wa = getWhatsAppNumber();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    void supabase
      .from("message_threads")
      .select("id, created_at, messages(id, body, created_at)")
      .eq("guest_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setThreads((data as Thread[]) ?? []));
  }, [user]);

  const activeThread = threads.find((t) => t.id === active);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
        Messages
      </h1>
      <div className="mt-3 h-px w-12 bg-gold" aria-hidden />
      <p className="mt-4 text-[1.0625rem] text-brand-900/60">
        Chat with MOJO about an enquiry or stay.
        {wa ? (
          <>
            {" "}
            Prefer WhatsApp?{" "}
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-royal underline decoration-gold/70 underline-offset-4"
            >
              Message us there
            </a>
            .
          </>
        ) : null}
      </p>
      {!user ? (
        <p className="mt-6 text-[1rem] text-brand-900/50">
          <Link
            to="/auth/sign-in"
            className="font-medium text-royal underline decoration-gold/70 underline-offset-4"
          >
            Sign in
          </Link>{" "}
          to view messages.
        </p>
      ) : threads.length === 0 ? (
        <p className="mt-6 text-[1rem] text-brand-900/50">No message threads yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={`w-full border px-4 py-3 text-left text-[0.9375rem] transition ${
                  active === t.id
                    ? "border-royal/30 bg-lavender/50 text-brand-900"
                    : "border-brand-900/10 bg-[#FBFaf7] text-brand-900/80 hover:bg-lavender/40"
                }`}
              >
                Thread · {new Date(t.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>
          <div className="flex min-h-[320px] flex-col border border-brand-900/10 bg-[#FBFaf7] p-5 md:col-span-2">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {(activeThread?.messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className="bg-lavender/70 px-3 py-2.5 text-[0.9375rem] text-brand-900"
                >
                  {m.body}
                </div>
              ))}
              {active && (activeThread?.messages ?? []).length === 0 ? (
                <p className="text-[0.875rem] text-brand-900/45">No messages in this thread yet.</p>
              ) : null}
              {!active ? (
                <p className="text-[0.875rem] text-brand-900/45">
                  Select a thread to read messages.
                </p>
              ) : null}
            </div>
            {active ? (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const supabase = getSupabase();
                  if (!supabase || !body.trim()) return;
                  void supabase
                    .from("messages")
                    .insert({ thread_id: active, sender_id: user.id, body })
                    .then(() => {
                      setBody("");
                      setThreads((prev) =>
                        prev.map((t) =>
                          t.id === active
                            ? {
                                ...t,
                                messages: [
                                  ...(t.messages ?? []),
                                  {
                                    id: crypto.randomUUID(),
                                    body,
                                    created_at: new Date().toISOString(),
                                  },
                                ],
                              }
                            : t,
                        ),
                      );
                    });
                }}
              >
                <label className="sr-only" htmlFor="message-body">
                  Message
                </label>
                <input
                  id="message-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 border border-brand-900/12 bg-white px-3 py-2 text-[0.9375rem] outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-royal px-4 py-2 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
                >
                  Send
                </button>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
