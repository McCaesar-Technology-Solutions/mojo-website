import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  adminAddMedia,
  adminListProperties,
  adminSavePricing,
  adminUpsertProperty,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { ghs } from "@/lib/format";
import type { Property, PropertyType } from "@/types/domain";

export const Route = createFileRoute("/admin/properties")({
  head: () => ({ meta: [{ title: "Properties | Admin" }] }),
  component: AdminPropertiesPage,
});

function AdminPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Property> | null>(null);
  const [nightly, setNightly] = useState(1500);
  const [cleaning, setCleaning] = useState(200);
  const [mediaUrl, setMediaUrl] = useState("");

  const reload = () =>
    adminListProperties()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for admin property CRUD.");
      return;
    }
    void reload();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-light">Properties</h1>
          <p className="text-sm text-gray-600">Create, price, publish, and attach media.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              title: "",
              slug: "",
              city: "Accra",
              type: "Apartment",
              status: "draft",
              booking_mode: "request",
              bedrooms: 1,
              bathrooms: 1,
              max_guests: 2,
              description: "",
            })
          }
          className="px-4 py-2 rounded-full bg-royal text-white text-sm"
        >
          New property
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{error}</p>}

      <div className="mt-6 space-y-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5 flex justify-between gap-4 flex-wrap"
          >
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-gray-500">
                /{p.slug} · {p.city} · {p.status} · {p.booking_mode}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">
                {ghs(
                  Number(
                    (p as Property & { property_pricing?: { nightly_rate: number } })
                      .property_pricing?.nightly_rate ??
                      p.pricing?.nightly_rate ??
                      0,
                  ),
                )}
              </span>
              <button
                className="text-sm text-royal underline"
                onClick={() => {
                  setEditing(p);
                  setNightly(Number(p.pricing?.nightly_rate ?? 1500));
                  setCleaning(Number(p.pricing?.cleaning_fee ?? 200));
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
            <h2 className="text-lg font-semibold">
              {editing.id ? "Edit property" : "New property"}
            </h2>
            {(
              [
                ["title", "Title"],
                ["slug", "Slug"],
                ["city", "City"],
                ["area", "Area"],
                ["description", "Description"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                {label}
                <input
                  className="mt-1 w-full border rounded-xl p-2"
                  value={(editing[key] as string) ?? ""}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                />
              </label>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Type
                <select
                  className="mt-1 w-full border rounded-xl p-2"
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value as PropertyType })}
                >
                  {["Apartment", "Hotel", "Suite", "Serviced"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Status
                <select
                  className="mt-1 w-full border rounded-xl p-2"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as Property["status"] })
                  }
                >
                  {["draft", "published", "archived"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Booking mode
                <select
                  className="mt-1 w-full border rounded-xl p-2"
                  value={editing.booking_mode}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      booking_mode: e.target.value as Property["booking_mode"],
                    })
                  }
                >
                  <option value="request">request</option>
                  <option value="instant">instant</option>
                </select>
              </label>
              <label className="text-sm">
                Featured
                <input
                  type="checkbox"
                  className="ml-2"
                  checked={Boolean(editing.is_featured)}
                  onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
                />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm">
                Nightly
                <input
                  type="number"
                  className="mt-1 w-full border rounded-xl p-2"
                  value={nightly}
                  onChange={(e) => setNightly(Number(e.target.value))}
                />
              </label>
              <label className="text-sm">
                Cleaning
                <input
                  type="number"
                  className="mt-1 w-full border rounded-xl p-2"
                  value={cleaning}
                  onChange={(e) => setCleaning(Number(e.target.value))}
                />
              </label>
              <label className="text-sm">
                Max guests
                <input
                  type="number"
                  className="mt-1 w-full border rounded-xl p-2"
                  value={editing.max_guests ?? 2}
                  onChange={(e) => setEditing({ ...editing, max_guests: Number(e.target.value) })}
                />
              </label>
            </div>
            {editing.id && (
              <label className="block text-sm">
                Add media URL
                <div className="mt-1 flex gap-2">
                  <input
                    className="flex-1 border rounded-xl p-2"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border text-sm"
                    onClick={() => {
                      if (!editing.id || !mediaUrl) return;
                      void adminAddMedia(editing.id, mediaUrl, true)
                        .then(() => setMediaUrl(""))
                        .catch((e) => setError(e.message));
                    }}
                  >
                    Add
                  </button>
                </div>
              </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-full border text-sm"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-full bg-royal text-white text-sm"
                onClick={() => {
                  if (!editing.title || !editing.slug || !editing.city || !editing.type) return;
                  void adminUpsertProperty(editing as Property)
                    .then(async (saved) => {
                      await adminSavePricing(saved.id, {
                        nightly_rate: nightly,
                        cleaning_fee: cleaning,
                        service_fee_rate: 0.046875,
                      });
                      setEditing(null);
                      await reload();
                    })
                    .catch((e) => setError(e.message));
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
