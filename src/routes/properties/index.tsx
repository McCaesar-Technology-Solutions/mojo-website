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
    }).then(({ properties: list }) => {
      setProperties(list);
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
            className="grid md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow-sm ring-1 ring-brand-900/5 mb-10"
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
            <label className="text-sm">
              <span className="text-xs uppercase tracking-wider text-gray-500">City</span>
              <select
                name="city"
                defaultValue={search.city ?? ""}
                className="mt-1 w-full border border-brand-900/10 rounded-xl px-3 py-2 bg-transparent"
              >
                <option value="">All cities</option>
                {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-xs uppercase tracking-wider text-gray-500">Type</span>
              <select
                name="type"
                defaultValue={search.type ?? ""}
                className="mt-1 w-full border border-brand-900/10 rounded-xl px-3 py-2 bg-transparent"
              >
                <option value="">All types</option>
                {["Apartment", "Hotel", "Suite", "Serviced"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-xs uppercase tracking-wider text-gray-500">Guests</span>
              <select
                name="guests"
                defaultValue={search.guests ?? ""}
                className="mt-1 w-full border border-brand-900/10 rounded-xl px-3 py-2 bg-transparent"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}+
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="self-end rounded-xl bg-royal text-white py-2.5 font-medium hover:opacity-90 transition"
            >
              Search
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  showDiscount={Boolean(p.pricing?.discount_label)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
