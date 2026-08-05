import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OpsAlert, OpsEmpty, OpsPageHeader, OpsPanel } from "@/components/admin/ops-ui";
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
    <div className="space-y-4">
      <OpsPageHeader title="Guests" description="Accounts and booking contacts." />
      {error && <OpsAlert>{error}</OpsAlert>}
      <div className="grid gap-4 md:grid-cols-2">
        <OpsPanel>
          <div className="border-b border-brand-900/10 px-4 py-3">
            <h2 className="text-[14px] font-semibold">Accounts</h2>
          </div>
          {profiles.length === 0 ? (
            <OpsEmpty>No guest accounts.</OpsEmpty>
          ) : (
            <ul className="divide-y divide-brand-900/8">
              {profiles.map((p) => (
                <li key={p.id} className="px-4 py-3 text-[13px]">
                  <span className="font-medium">{p.full_name ?? "Guest"}</span>
                  <span className="text-brand-900/50"> · {p.phone ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </OpsPanel>
        <OpsPanel>
          <div className="border-b border-brand-900/10 px-4 py-3">
            <h2 className="text-[14px] font-semibold">Booking contacts</h2>
          </div>
          {uniqueContacts.length === 0 ? (
            <OpsEmpty>No booking contacts yet.</OpsEmpty>
          ) : (
            <ul className="divide-y divide-brand-900/8">
              {uniqueContacts.map((c) => (
                <li key={c.guest_email} className="px-4 py-3 text-[13px]">
                  <p className="font-medium">{c.guest_name}</p>
                  <p className="text-[12px] text-brand-900/50">
                    {c.guest_email} · {c.guest_phone}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </OpsPanel>
      </div>
    </div>
  );
}
