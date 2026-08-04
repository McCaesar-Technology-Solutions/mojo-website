import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListGuests } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/guests")({
  head: () => ({ meta: [{ title: "Guests | Admin" }] }),
  component: AdminGuestsPage,
});

function AdminGuestsPage() {
  const [profiles, setProfiles] = useState<
    { full_name: string | null; phone: string | null; id: string }[]
  >([]);
  const [contacts, setContacts] = useState<
    { guest_name: string; guest_email: string; guest_phone: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for guest directory.");
      return;
    }
    void adminListGuests()
      .then((data) => {
        setProfiles(data.profiles as typeof profiles);
        setContacts(data.bookingContacts as typeof contacts);
      })
      .catch((e) => setError(e.message));
  }, []);

  const uniqueContacts = Array.from(new Map(contacts.map((c) => [c.guest_email, c])).values());

  return (
    <div>
      <h1 className="text-2xl font-light">Guests</h1>
      <p className="text-sm text-gray-600">Profiles and booking contacts.</p>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="font-medium mb-3">Accounts</h2>
          <div className="space-y-2">
            {profiles.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 text-sm ring-1 ring-brand-900/5">
                {p.full_name ?? "Guest"} · {p.phone ?? "—"}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-medium mb-3">Booking contacts</h2>
          <div className="space-y-2">
            {uniqueContacts.map((c) => (
              <div
                key={c.guest_email}
                className="bg-white rounded-xl p-3 text-sm ring-1 ring-brand-900/5"
              >
                {c.guest_name} · {c.guest_email} · {c.guest_phone}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
