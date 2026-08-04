import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

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
      <h1 className="text-3xl font-light">Messages</h1>
      <p className="mt-2 text-gray-600">Chat with MOJO about an enquiry or booking.</p>
      {!user ? (
        <p className="mt-6 text-sm text-gray-500">Sign in to view messages.</p>
      ) : threads.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No message threads yet.</p>
      ) : (
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`w-full text-left p-4 rounded-xl bg-white ring-1 ring-brand-900/5 ${
                  active === t.id ? "ring-gold" : ""
                }`}
              >
                Thread · {new Date(t.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>
          <div className="md:col-span-2 bg-white rounded-2xl p-5 ring-1 ring-brand-900/5 min-h-[320px] flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {(activeThread?.messages ?? []).map((m) => (
                <div key={m.id} className="bg-lavender rounded-xl p-3 text-sm">
                  {m.body}
                </div>
              ))}
            </div>
            {active && (
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
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 border border-brand-900/10 rounded-xl px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-royal text-white text-sm"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
