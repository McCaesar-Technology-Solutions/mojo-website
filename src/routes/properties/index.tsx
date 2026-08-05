import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PropertyCard } from "@/components/properties/property-card";
import { listPublishedProperties } from "@/lib/properties";
import type { Property } from "@/types/domain";

const searchSchema = z.object({
  city: z.string().optional(),
  guests: z.coerce.number().optional(),
  type: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});

export const Route = createFileRoute("/properties/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Properties | MOJO Apartments" },
      { name: "description", content: "Browse premium MOJO apartments and hotels across Ghana." },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void listPublishedProperties({
      city: search.city,
      guests: search.guests,
    })
      .then(({ properties: list }) => {
        setProperties(list);
        setLoading(false);
      })
      .catch(() => {
        setProperties([]);
        setLoading(false);
      });
  }, [search.city, search.guests]);

  const filtered = useMemo(() => {
    if (!search.type) return properties;
    return properties.filter((p) => p.type === search.type);
  }, [properties, search.type]);

  return (
    <div className="bg-brand-50 text-brand-900 font-sans min-h-screen">
      <SiteNav />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-gold text-sm uppercase tracking-widest font-medium">Browse</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-light">Properties across Ghana</h1>
            <p className="mt-2 text-gray-600">
              Request to Book — our team confirms availability within 24 hours.
            </p>
          </div>

          <form
            className="mb-10 flex flex-col gap-1 rounded-2xl bg-white p-2 shadow-lg shadow-brand-900/5 ring-1 ring-brand-900/5 md:flex-row md:items-stretch"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void navigate({
                search: {
                  city: String(fd.get("city") || undefined) || undefined,
                  guests: Number(fd.get("guests") || undefined) || undefined,
                  type: String(fd.get("type") || undefined) || undefined,
                  checkIn: String(fd.get("checkIn") || undefined) || undefined,
                  checkOut: String(fd.get("checkOut") || undefined) || undefined,
                },
              });
            }}
          >
            <label className="group flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-lavender/60">
              <iconify-icon icon="solar:map-point-linear" width="20" style={{ color: "#C89B2C" }} />
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  City
                </span>
                <div className="relative mt-0.5">
                  <select
                    name="city"
                    defaultValue={search.city ?? ""}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-brand-900 focus:outline-none"
                  >
                    <option value="">All cities</option>
                    {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <iconify-icon
                    icon="solar:alt-arrow-down-linear"
                    width="14"
                    className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-brand-900/40"
                  />
                </div>
              </div>
            </label>

            <div className="hidden w-px self-stretch bg-brand-900/8 md:block" aria-hidden />

            <label className="group flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-lavender/60">
              <iconify-icon icon="solar:buildings-2-linear" width="20" style={{ color: "#C89B2C" }} />
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  Type
                </span>
                <div className="relative mt-0.5">
                  <select
                    name="type"
                    defaultValue={search.type ?? ""}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-brand-900 focus:outline-none"
                  >
                    <option value="">All types</option>
                    {["Apartment", "Hotel", "Suite", "Serviced"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <iconify-icon
                    icon="solar:alt-arrow-down-linear"
                    width="14"
                    className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-brand-900/40"
                  />
                </div>
              </div>
            </label>

            <div className="hidden w-px self-stretch bg-brand-900/8 md:block" aria-hidden />

            <label className="group flex flex-1 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-lavender/60">
              <iconify-icon
                icon="solar:users-group-rounded-linear"
                width="20"
                style={{ color: "#C89B2C" }}
              />
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  Guests
                </span>
                <div className="relative mt-0.5">
                  <select
                    name="guests"
                    defaultValue={search.guests ?? ""}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-brand-900 focus:outline-none"
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </select>
                  <iconify-icon
                    icon="solar:alt-arrow-down-linear"
                    width="14"
                    className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-brand-900/40"
                  />
                </div>
              </div>
            </label>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-royal px-6 py-3 font-medium text-white transition hover:opacity-90 md:self-stretch"
            >
              <iconify-icon icon="solar:magnifer-linear" width="18" />
              <span>Search</span>
            </button>
          </form>

          {loading ? (
            <p className="text-gray-500">Loading stays…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-brand-900">No properties match those filters.</p>
              <Link to="/properties" className="mt-4 inline-block text-gold underline">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6 md:gap-8">
              {filtered.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
