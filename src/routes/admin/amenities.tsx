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
} from "@/components/admin/ops-ui";
import {
  adminCreateAmenity,
  adminDeleteAmenity,
  adminListAmenities,
  adminUpdateAmenity,
} from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import type { Amenity } from "@/types/domain";

export const Route = createFileRoute("/admin/amenities")({
  head: () => ({ meta: [{ title: "Amenities | Admin" }] }),
  component: AdminAmenitiesPage,
});

function AdminAmenitiesPage() {
  const [items, setItems] = useState<Amenity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("solar:check-circle-bold");
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Amenity>>({});

  const reload = () =>
    adminListAmenities()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  useEffect(() => {
    if (!getSupabase()) {
      setError("Supabase required for amenities catalog.");
      return;
    }
    void reload();
  }, []);

  const create = () => {
    if (!label.trim()) {
      setError("Label is required.");
      return;
    }
    setBusy(true);
    setError(null);
    void adminCreateAmenity({
      label,
      icon,
      sort_order: sortOrder,
    })
      .then(() => {
        setLabel("");
        setIcon("solar:check-circle-bold");
        setSortOrder((items.at(-1)?.sort_order ?? 0) + 1);
        return reload();
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Create failed"))
      .finally(() => setBusy(false));
  };

  const startEdit = (amenity: Amenity) => {
    setEditingId(amenity.id);
    setEditDraft({
      label: amenity.label,
      icon: amenity.icon,
      sort_order: amenity.sort_order,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setBusy(true);
    setError(null);
    void adminUpdateAmenity(editingId, {
      label: editDraft.label,
      icon: editDraft.icon,
      sort_order: editDraft.sort_order,
    })
      .then(() => {
        setEditingId(null);
        setEditDraft({});
        return reload();
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Update failed"))
      .finally(() => setBusy(false));
  };

  return (
    <div className="space-y-4">
      <OpsPageHeader
        title="Amenities"
        description="Catalog of amenity labels assigned to properties. Deleting removes the option only when no properties use it."
      />

      {error && <OpsAlert>{error}</OpsAlert>}

      <OpsPanel className="p-4">
        <h2 className="text-[14px] font-semibold">Add amenity</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="text-[12px] font-medium text-brand-900/60 md:col-span-2">
            Label
            <OpsInput
              className="mt-1"
              value={label}
              placeholder="e.g. Rooftop pool"
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <label className="text-[12px] font-medium text-brand-900/60">
            Icon key
            <OpsInput
              className="mt-1"
              value={icon}
              placeholder="solar:check-circle-bold"
              onChange={(e) => setIcon(e.target.value)}
            />
          </label>
          <label className="text-[12px] font-medium text-brand-900/60">
            Sort order
            <OpsInput
              type="number"
              className="mt-1"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <OpsPrimaryButton type="button" disabled={busy} onClick={create}>
            {busy ? "Saving…" : "Add amenity"}
          </OpsPrimaryButton>
          <p className="text-[12px] text-brand-900/45">
            Icons use Iconify keys (e.g. <code>solar:wi-fi-router-bold</code>).
          </p>
        </div>
      </OpsPanel>

      {items.length === 0 ? (
        <OpsEmpty>No amenities yet. Add one above or run seed.sql.</OpsEmpty>
      ) : (
        <OpsPanel className="overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-brand-900/10 bg-[#FBFaf7] text-[11px] uppercase tracking-[0.06em] text-brand-900/45">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Amenity</th>
                <th className="px-4 py-2.5 font-semibold">Icon</th>
                <th className="px-4 py-2.5 font-semibold">Sort</th>
                <th className="px-4 py-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/8">
              {items.map((amenity) => {
                const editing = editingId === amenity.id;
                return (
                  <tr key={amenity.id} className="align-middle hover:bg-lavender/25">
                    <td className="px-4 py-3">
                      {editing ? (
                        <OpsInput
                          value={editDraft.label ?? ""}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, label: e.target.value }))
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <iconify-icon icon={amenity.icon} width="16" />
                          <span className="font-medium">{amenity.label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <OpsInput
                          value={editDraft.icon ?? ""}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, icon: e.target.value }))
                          }
                        />
                      ) : (
                        <span className="font-mono text-[12px] text-brand-900/55">
                          {amenity.icon}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {editing ? (
                        <OpsInput
                          type="number"
                          className="max-w-[88px]"
                          value={editDraft.sort_order ?? 0}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              sort_order: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        amenity.sort_order
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editing ? (
                        <div className="flex justify-end gap-2">
                          <OpsSecondaryButton
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft({});
                            }}
                          >
                            Cancel
                          </OpsSecondaryButton>
                          <OpsPrimaryButton type="button" disabled={busy} onClick={saveEdit}>
                            Save
                          </OpsPrimaryButton>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            className="text-[13px] font-medium text-royal hover:underline"
                            onClick={() => startEdit(amenity)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            className="text-[13px] font-medium text-rose-800 hover:underline disabled:opacity-50"
                            onClick={() => {
                              const ok = window.confirm(
                                `Delete amenity “${amenity.label}”? Only works if no properties use it.`,
                              );
                              if (!ok) return;
                              setBusy(true);
                              setError(null);
                              void adminDeleteAmenity(amenity.id)
                                .then(() => reload())
                                .catch((e) =>
                                  setError(e instanceof Error ? e.message : "Delete failed"),
                                )
                                .finally(() => setBusy(false));
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </OpsPanel>
      )}
    </div>
  );
}
