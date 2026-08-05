import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  OpsAlert,
  OpsEmpty,
  OpsInput,
  OpsPageHeader,
  OpsPanel,
  OpsPrimaryButton,
  OpsSecondaryButton,
  OpsSelect,
  OpsStatus,
} from "@/components/admin/ops-ui";
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
    <div className="space-y-4">
      <OpsPageHeader
        title="Properties"
        description="Create, price, publish, and attach media."
        actions={
          <OpsPrimaryButton
            type="button"
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
          >
            New property
          </OpsPrimaryButton>
        }
      />

      {error && <OpsAlert>{error}</OpsAlert>}

      {items.length === 0 ? (
        <OpsEmpty>No properties yet.</OpsEmpty>
      ) : (
        <OpsPanel className="overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-brand-900/10 bg-[#FBFaf7] text-[11px] uppercase tracking-[0.06em] text-brand-900/45">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Property</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Nightly</th>
                <th className="px-4 py-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/8">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-lavender/25">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-[12px] text-brand-900/50">
                      /{p.slug} · {p.city} · {p.type}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <OpsStatus
                      status={p.status}
                      tone={
                        p.status === "published" ? "ok" : p.status === "draft" ? "review" : "neutral"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {ghs(
                      Number(
                        (p as Property & { property_pricing?: { nightly_rate: number } })
                          .property_pricing?.nightly_rate ??
                          p.pricing?.nightly_rate ??
                          0,
                      ),
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-[13px] font-medium text-royal hover:underline"
                      onClick={() => {
                        setEditing(p);
                        setNightly(Number(p.pricing?.nightly_rate ?? 1500));
                        setCleaning(Number(p.pricing?.cleaning_fee ?? 200));
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpsPanel>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-brand-900/10 bg-white p-5 shadow-[0_12px_40px_rgba(36,16,77,0.18)]">
            <h2 className="text-[1.375rem] font-semibold tracking-[-0.02em]">
              {editing.id ? "Edit property" : "New property"}
            </h2>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["title", "Title"],
                  ["slug", "Slug"],
                  ["city", "City"],
                  ["area", "Area"],
                  ["description", "Description"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-[12px] font-medium text-brand-900/60">
                  {label}
                  <OpsInput
                    className="mt-1"
                    value={(editing[key] as string) ?? ""}
                    onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  />
                </label>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12px] font-medium text-brand-900/60">
                  Type
                  <OpsSelect
                    className="mt-1"
                    value={editing.type}
                    onChange={(e) =>
                      setEditing({ ...editing, type: e.target.value as PropertyType })
                    }
                  >
                    {["Apartment", "Hotel", "Suite", "Serviced"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </OpsSelect>
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Status
                  <OpsSelect
                    className="mt-1"
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({ ...editing, status: e.target.value as Property["status"] })
                    }
                  >
                    {["draft", "published", "archived"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </OpsSelect>
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Booking mode
                  <OpsSelect className="mt-1" value="request" disabled>
                    <option value="request">request</option>
                  </OpsSelect>
                </label>
                <label className="flex items-center gap-2 pt-6 text-[13px] text-brand-900">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.is_featured)}
                    onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
                  />
                  Featured
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-[12px] font-medium text-brand-900/60">
                  Nightly
                  <OpsInput
                    type="number"
                    className="mt-1"
                    value={nightly}
                    onChange={(e) => setNightly(Number(e.target.value))}
                  />
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Cleaning
                  <OpsInput
                    type="number"
                    className="mt-1"
                    value={cleaning}
                    onChange={(e) => setCleaning(Number(e.target.value))}
                  />
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Max guests
                  <OpsInput
                    type="number"
                    className="mt-1"
                    value={editing.max_guests ?? 2}
                    onChange={(e) =>
                      setEditing({ ...editing, max_guests: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              {editing.id && (
                <label className="block text-[12px] font-medium text-brand-900/60">
                  Add media URL
                  <div className="mt-1 flex gap-2">
                    <OpsInput
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                    />
                    <OpsSecondaryButton
                      type="button"
                      onClick={() => {
                        if (!editing.id || !mediaUrl) return;
                        void adminAddMedia(editing.id, mediaUrl, true)
                          .then(() => setMediaUrl(""))
                          .catch((e) => setError(e.message));
                      }}
                    >
                      Add
                    </OpsSecondaryButton>
                  </div>
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <OpsSecondaryButton type="button" onClick={() => setEditing(null)}>
                Cancel
              </OpsSecondaryButton>
              <OpsPrimaryButton
                type="button"
                onClick={() => {
                  if (!editing.title || !editing.slug || !editing.city || !editing.type) return;
                  void adminUpsertProperty({
                    ...(editing as Property),
                    booking_mode: "request",
                  })
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
              </OpsPrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
