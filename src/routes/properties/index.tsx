import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { GuestShell } from "@/components/layout/guest-shell";
import { PropertyCard } from "@/components/properties/property-card";
import {
  CatalogEmpty,
  CatalogLoading,
  CatalogUnavailable,
} from "@/components/properties/catalog-status";
import { usePublishedProperties } from "@/lib/use-published-properties";

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
      {
        name: "description",
        content: "Browse MOJO-managed apartments and hotels across Ghana. Request to Book.",
      },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { properties, loading, error, retry } = usePublishedProperties({
    city: search.city,
    guests: search.guests,
  });
  const hasFilters = Boolean(search.city || search.guests || search.type);

  const filtered = useMemo(() => {
    if (!search.type) return properties;
    return properties.filter((p) => p.type === search.type);
  }, [properties, search.type]);

  return (
    <GuestShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 md:mb-12">
          <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-normal tracking-[-0.02em] text-brand-900">
            Managed stays across Ghana
          </h1>
          <div className="mt-3 h-px w-16 bg-gold" aria-hidden />
          <p className="mt-4 max-w-2xl text-[1.0625rem] text-brand-900/60">
            Specific apartments and hotels we operate. Request to Book — our team confirms
            availability, usually within 24 hours.
          </p>
          {search.checkIn && search.checkOut ? (
            <p className="mt-3 max-w-2xl text-[0.875rem] text-brand-900/50">
              Your dates travel with the search into Request to Book. Availability is confirmed per
              stay — this list is not Instant Book.
            </p>
          ) : null}
        </div>

        <form
          className="mb-10 grid overflow-hidden border border-brand-900/10 bg-[#FBFaf7] sm:grid-cols-[1fr_1.2fr_1fr_1fr_auto]"
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
          <label className="border-b border-brand-900/10 px-4 py-3 sm:border-b-0 sm:border-r">
            <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              City
            </span>
            <select
              name="city"
              defaultValue={search.city ?? ""}
              className="mt-1 w-full cursor-pointer appearance-none bg-transparent text-[0.9375rem] font-medium text-brand-900 outline-none"
            >
              <option value="">All cities</option>
              {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 border-b border-brand-900/10 sm:border-b-0 sm:border-r">
            <label htmlFor="properties-check-in" className="px-4 py-3">
              <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                Check in
              </span>
              <input
                id="properties-check-in"
                type="date"
                name="checkIn"
                defaultValue={search.checkIn ?? ""}
                className="mt-1 min-h-11 w-full min-w-0 bg-transparent text-[1rem] font-medium text-brand-900 outline-none sm:min-h-0 sm:text-[0.875rem]"
              />
            </label>
            <label
              htmlFor="properties-check-out"
              className="border-l border-brand-900/10 px-4 py-3"
            >
              <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                Check out
              </span>
              <input
                id="properties-check-out"
                type="date"
                name="checkOut"
                defaultValue={search.checkOut ?? ""}
                className="mt-1 min-h-11 w-full min-w-0 bg-transparent text-[1rem] font-medium text-brand-900 outline-none sm:min-h-0 sm:text-[0.875rem]"
              />
            </label>
          </div>
          <label className="border-b border-brand-900/10 px-4 py-3 sm:border-b-0 sm:border-r">
            <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              Type
            </span>
            <select
              name="type"
              defaultValue={search.type ?? ""}
              className="mt-1 w-full cursor-pointer appearance-none bg-transparent text-[0.9375rem] font-medium text-brand-900 outline-none"
            >
              <option value="">All types</option>
              {["Apartment", "Hotel", "Suite", "Serviced"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="border-b border-brand-900/10 px-4 py-3 sm:border-b-0 sm:border-r">
            <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              Guests
            </span>
            <select
              name="guests"
              defaultValue={search.guests ?? ""}
              className="mt-1 w-full cursor-pointer appearance-none bg-transparent text-[0.9375rem] font-medium text-brand-900 outline-none"
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
            className="flex min-h-11 items-center justify-center gap-2 bg-royal px-6 py-3.5 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
          >
            <iconify-icon icon="solar:magnifer-linear" width="18" />
            Search stays
          </button>
        </form>

        {loading ? (
          <CatalogLoading />
        ) : error ? (
          <CatalogUnavailable onRetry={retry} />
        ) : filtered.length === 0 ? (
          <CatalogEmpty>
            {hasFilters ? (
              <>
                <p>No properties match those filters.</p>
                <Link
                  to="/properties"
                  className="mt-4 inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-royal underline decoration-gold/70 underline-offset-4"
                >
                  Clear filters
                </Link>
              </>
            ) : (
              <p>No published stays yet. Check back soon.</p>
            )}
          </CatalogEmpty>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {filtered.map((p, i) => (
              <PropertyCard
                key={p.id}
                property={p}
                index={i}
                stay={{
                  checkIn: search.checkIn,
                  checkOut: search.checkOut,
                  guests: search.guests,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </GuestShell>
  );
}
