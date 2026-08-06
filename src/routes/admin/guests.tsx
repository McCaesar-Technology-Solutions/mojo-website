import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsInput,
  OpsPageHeader,
  OpsPanel,
  OpsPrimaryButton,
  OpsSecondaryButton,
} from "@/components/admin/ops-ui";
import { adminListGuests, adminUpdateGuest } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/guests")({
  head: () => ({ meta: [{ title: "Guests | Admin" }] }),
  component: AdminGuestsPage,
});

type GuestProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
};

type BookingContact = {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
};

function AdminGuestsPage() {
  const [profiles, setProfiles] = useState<GuestProfile[]>([]);
  const [contacts, setContacts] = useState<BookingContact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () =>
    adminListGuests()
      .then((data) => {
        setProfiles(data.profiles as GuestProfile[]);
        setContacts(data.bookingContacts as BookingContact[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for guest directory.");
      return;
    }
    void reload();
  }, []);

  const uniqueContacts = useMemo(
    () => Array.from(new Map(contacts.map((c) => [c.guest_email, c])).values()),
    [contacts],
  );

  const filteredProfiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return profiles;
    return profiles.filter((p) =>
      [p.full_name ?? "", p.phone ?? "", p.id].join(" ").toLowerCase().includes(needle),
    );
  }, [profiles, query]);

  const filteredContacts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return uniqueContacts;
    return uniqueContacts.filter((c) =>
      [c.guest_name, c.guest_email, c.guest_phone].join(" ").toLowerCase().includes(needle),
    );
  }, [uniqueContacts, query]);

  const startEdit = (p: GuestProfile) => {
    setEditingId(p.id);
    setDraftName(p.full_name ?? "");
    setDraftPhone(p.phone ?? "");
  };

  const saveEdit = () => {
    if (!editingId) return;
    setBusy(true);
    setError(null);
    void adminUpdateGuest(editingId, {
      full_name: draftName,
      phone: draftPhone,
    })
      .then(() => {
        setEditingId(null);
        return reload();
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Update failed"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Guests"
        description="Edit guest name and phone only. Admin role promotion stays SQL-only."
        actions={
          <OpsInput
            className="w-full min-w-[200px] sm:w-64"
            value={query}
            placeholder="Search guests…"
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      />
      {error && <OpsAlert>{error}</OpsAlert>}
      <div className="grid gap-4 md:grid-cols-2">
        <OpsPanel>
          <div className="border-b border-brand-900/10 px-4 py-3">
            <h2 className="text-[14px] font-semibold">Accounts</h2>
            <p className="mt-0.5 text-[12px] text-brand-900/45">
              Signed-up guests · role cannot be changed here
            </p>
          </div>
          {filteredProfiles.length === 0 ? (
            <OpsEmpty>No guest accounts.</OpsEmpty>
          ) : (
            <ul className="divide-y divide-brand-900/8">
              {filteredProfiles.map((p) => {
                const editing = editingId === p.id;
                return (
                  <li key={p.id} className="px-4 py-3 text-[13px]">
                    {editing ? (
                      <div className="space-y-2">
                        <OpsInput
                          value={draftName}
                          placeholder="Full name"
                          onChange={(e) => setDraftName(e.target.value)}
                        />
                        <OpsInput
                          value={draftPhone}
                          placeholder="Phone"
                          onChange={(e) => setDraftPhone(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <OpsSecondaryButton
                            type="button"
                            disabled={busy}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </OpsSecondaryButton>
                          <OpsPrimaryButton type="button" disabled={busy} onClick={saveEdit}>
                            Save
                          </OpsPrimaryButton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{p.full_name ?? "Guest"}</p>
                          <p className="text-[12px] text-brand-900/50">{p.phone ?? "No phone"}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-brand-900/35">
                            {p.id.slice(0, 8)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-[13px] font-medium text-royal hover:underline"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </OpsPanel>
        <OpsPanel>
          <div className="border-b border-brand-900/10 px-4 py-3">
            <h2 className="text-[14px] font-semibold">Booking contacts</h2>
            <p className="mt-0.5 text-[12px] text-brand-900/45">
              From confirmed stays (may include guests without accounts)
            </p>
          </div>
          {filteredContacts.length === 0 ? (
            <OpsEmpty>No booking contacts yet.</OpsEmpty>
          ) : (
            <ul className="divide-y divide-brand-900/8">
              {filteredContacts.map((c) => (
                <li key={c.guest_email} className="px-4 py-3 text-[13px]">
                  <p className="font-medium">{c.guest_name}</p>
                  <p className="text-[12px] text-brand-900/50">
                    <a className="text-royal hover:underline" href={`mailto:${c.guest_email}`}>
                      {c.guest_email}
                    </a>
                    {" · "}
                    <a className="text-royal hover:underline" href={`tel:${c.guest_phone}`}>
                      {c.guest_phone}
                    </a>
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
