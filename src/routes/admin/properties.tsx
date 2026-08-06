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
  OpsTextarea,
} from "@/components/admin/ops-ui";
import {
  adminAddMedia,
  adminListAmenities,
  adminListProperties,
  adminSavePricing,
  adminSetPropertyAmenities,
  adminUpsertProperty,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { ghs } from "@/lib/format";
import type { Amenity, Property, PropertyType } from "@/types/domain";

export const Route = createFileRoute("/admin/properties")({
  head: () => ({ meta: [{ title: "Properties | Admin" }] }),
  component: AdminPropertiesPage,
});

const emptyDraft = (): Partial<Property> => ({
  title: "",
  slug: "",
  city: "Accra",
  area: "",
  type: "Apartment",
  status: "draft",
  booking_mode: "request",
  bedrooms: 1,
  bathrooms: 1,
  max_guests: 2,
  size_sqm: null,
  check_in_time: "15:00",
  check_out_time: "11:00",
  description: "",
  house_rules: [],
  is_featured: false,
});

function AdminPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [amenitiesCatalog, setAmenitiesCatalog] = useState<Amenity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Property> | null>(null);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [ruleDraft, setRuleDraft] = useState("");
  const [nightly, setNightly] = useState(1500);
  const [cleaning, setCleaning] = useState(200);
  const [mediaUrl, setMediaUrl] = useState("");

  const reload = () =>
    Promise.all([adminListProperties(), adminListAmenities()])
      .then(([properties, amenities]) => {
        setItems(properties);
        setAmenitiesCatalog(amenities);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for admin property CRUD.");
      return;
    }
    void reload();
  }, []);

  const openCreate = () => {
    setEditing(emptyDraft());
    setSelectedAmenityIds([]);
    setRuleDraft("");
    setNightly(1500);
    setCleaning(200);
    setMediaUrl("");
  };

  const openEdit = (p: Property) => {
    setEditing({
      ...p,
      house_rules: p.house_rules ?? [],
    });
    setSelectedAmenityIds((p.amenities ?? []).map((a) => a.id));
    setRuleDraft("");
    setNightly(Number(p.pricing?.nightly_rate ?? 1500));
    setCleaning(Number(p.pricing?.cleaning_fee ?? 200));
    setMediaUrl("");
  };

  const closeEditor = () => {
    setEditing(null);
    setSaving(false);
    setRuleDraft("");
    setMediaUrl("");
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addHouseRule = () => {
    const next = ruleDraft.trim();
    if (!next || !editing) return;
    const existing = editing.house_rules ?? [];
    if (existing.includes(next)) {
      setRuleDraft("");
      return;
    }
    setEditing({ ...editing, house_rules: [...existing, next] });
    setRuleDraft("");
  };

  const removeHouseRule = (rule: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      house_rules: (editing.house_rules ?? []).filter((r) => r !== rule),
    });
  };

  const save = () => {
    if (!editing?.title || !editing.slug || !editing.city || !editing.type) return;
    setSaving(true);
    setError(null);

    void adminUpsertProperty({
      id: editing.id,
      title: editing.title,
      slug: editing.slug,
      city: editing.city,
      area: editing.area,
      type: editing.type,
      status: editing.status ?? "draft",
      booking_mode: "request",
      description: editing.description,
      max_guests: editing.max_guests,
      bedrooms: editing.bedrooms,
      bathrooms: editing.bathrooms,
      size_sqm: editing.size_sqm,
      check_in_time: editing.check_in_time,
      check_out_time: editing.check_out_time,
      house_rules: editing.house_rules ?? [],
      is_featured: editing.is_featured,
    })
      .then(async (saved) => {
        await adminSavePricing(saved.id, {
          nightly_rate: nightly,
          cleaning_fee: cleaning,
          service_fee_rate: 0.046875,
        });
        await adminSetPropertyAmenities(saved.id, selectedAmenityIds);
        closeEditor();
        await reload();
      })
      .catch((e) => {
        setSaving(false);
        setError(e instanceof Error ? e.message : "Save failed");
      });
  };

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Properties"
        description="Create, price, publish, assign amenities, and archive inventory."
        actions={
          <OpsPrimaryButton type="button" onClick={openCreate}>
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
                      /{p.slug} · {p.city} · {p.type} · {p.bedrooms} bed ·{" "}
                      {(p.amenities ?? []).length} amenities
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <OpsStatus
                      status={p.status}
                      tone={
                        p.status === "published"
                          ? "ok"
                          : p.status === "draft"
                            ? "review"
                            : "neutral"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {ghs(Number(p.pricing?.nightly_rate ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-[13px] font-medium text-royal hover:underline"
                      onClick={() => openEdit(p)}
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-brand-900/10 bg-white p-5 shadow-[0_12px_40px_rgba(36,16,77,0.18)]">
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

              <label className="block text-[12px] font-medium text-brand-900/60">
                Description
                <OpsTextarea
                  className="mt-1 min-h-[88px]"
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </label>

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
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived (hidden from guests)</option>
                  </OpsSelect>
                  <span className="mt-1 block text-[11px] font-normal text-brand-900/45">
                    Use archived to soft-remove inventory. Do not hard-delete live bookings.
                  </span>
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="text-[12px] font-medium text-brand-900/60">
                  Bedrooms
                  <OpsInput
                    type="number"
                    min={0}
                    className="mt-1"
                    value={editing.bedrooms ?? 1}
                    onChange={(e) =>
                      setEditing({ ...editing, bedrooms: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Bathrooms
                  <OpsInput
                    type="number"
                    min={0}
                    className="mt-1"
                    value={editing.bathrooms ?? 1}
                    onChange={(e) =>
                      setEditing({ ...editing, bathrooms: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Max guests
                  <OpsInput
                    type="number"
                    min={1}
                    className="mt-1"
                    value={editing.max_guests ?? 2}
                    onChange={(e) =>
                      setEditing({ ...editing, max_guests: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Size (sqm)
                  <OpsInput
                    type="number"
                    min={0}
                    className="mt-1"
                    value={editing.size_sqm ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        size_sqm: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-[12px] font-medium text-brand-900/60">
                  Check-in
                  <OpsInput
                    className="mt-1"
                    value={editing.check_in_time ?? "15:00"}
                    onChange={(e) =>
                      setEditing({ ...editing, check_in_time: e.target.value })
                    }
                    placeholder="15:00"
                  />
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Check-out
                  <OpsInput
                    className="mt-1"
                    value={editing.check_out_time ?? "11:00"}
                    onChange={(e) =>
                      setEditing({ ...editing, check_out_time: e.target.value })
                    }
                    placeholder="11:00"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-[12px] font-medium text-brand-900/60">
                  Nightly
                  <OpsInput
                    type="number"
                    min={0}
                    className="mt-1"
                    value={nightly}
                    onChange={(e) => setNightly(Number(e.target.value))}
                  />
                </label>
                <label className="text-[12px] font-medium text-brand-900/60">
                  Cleaning
                  <OpsInput
                    type="number"
                    min={0}
                    className="mt-1"
                    value={cleaning}
                    onChange={(e) => setCleaning(Number(e.target.value))}
                  />
                </label>
                <div className="text-[12px] font-medium text-brand-900/60">
                  Service fee
                  <p className="mt-2 text-[13px] font-normal text-brand-900/70">4.6875% (fixed)</p>
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium text-brand-900/60">House rules</p>
                <div className="mt-1 flex gap-2">
                  <OpsInput
                    value={ruleDraft}
                    placeholder="e.g. No parties or events"
                    onChange={(e) => setRuleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addHouseRule();
                      }
                    }}
                  />
                  <OpsSecondaryButton type="button" onClick={addHouseRule}>
                    Add
                  </OpsSecondaryButton>
                </div>
                {(editing.house_rules ?? []).length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {(editing.house_rules ?? []).map((rule) => (
                      <li
                        key={rule}
                        className="flex items-center justify-between gap-2 border border-brand-900/8 bg-[#FBFaf7] px-2.5 py-1.5 text-[13px]"
                      >
                        <span>{rule}</span>
                        <button
                          type="button"
                          className="text-[12px] font-medium text-rose-800 hover:underline"
                          onClick={() => removeHouseRule(rule)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12px] text-brand-900/45">No house rules yet.</p>
                )}
              </div>

              <div>
                <p className="text-[12px] font-medium text-brand-900/60">Amenities</p>
                {amenitiesCatalog.length === 0 ? (
                  <p className="mt-2 text-[12px] text-brand-900/45">
                    No amenities catalog found. Run seed.sql to load defaults.
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {amenitiesCatalog.map((amenity) => {
                      const checked = selectedAmenityIds.includes(amenity.id);
                      return (
                        <label
                          key={amenity.id}
                          className="flex cursor-pointer items-center gap-2 border border-brand-900/8 px-2.5 py-2 text-[13px] hover:bg-lavender/30"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAmenity(amenity.id)}
                          />
                          <span>{amenity.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {editing.id && (
                <label className="block text-[12px] font-medium text-brand-900/60">
                  Add media URL
                  <div className="mt-1 flex gap-2">
                    <OpsInput
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://…"
                    />
                    <OpsSecondaryButton
                      type="button"
                      onClick={() => {
                        if (!editing.id || !mediaUrl) return;
                        void adminAddMedia(editing.id, mediaUrl, true)
                          .then(() => setMediaUrl(""))
                          .catch((e) =>
                            setError(e instanceof Error ? e.message : "Media add failed"),
                          );
                      }}
                    >
                      Add
                    </OpsSecondaryButton>
                  </div>
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <OpsSecondaryButton type="button" onClick={closeEditor} disabled={saving}>
                Cancel
              </OpsSecondaryButton>
              <OpsPrimaryButton type="button" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </OpsPrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
