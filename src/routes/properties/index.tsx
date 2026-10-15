import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { GuestShell } from "@/components/layout/guest-shell";
import { PropertyCard } from "@/components/properties/property-card";
import {
  CatalogEmpty,
  CatalogLoading,
  CatalogUnavailable,
} from "@/components/properties/catalog-status";
import { usePublishedProperties } from "@/lib/use-published-properties";
import {
  GUEST_CITIES,
  GUEST_TYPES,
  StayDateRange,
  StaySelect,
} from "@/components/guest/stay-pickers";
import { defaultStayDates } from "@/lib/format";

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
  const defaults = defaultStayDates();
  const [city, setCity] = useState(search.city ?? "__all__");
  const [guests, setGuests] = useState(search.guests ? String(search.guests) : "__all__");
  const [type, setType] = useState(search.type ?? "__all__");
  const [checkIn, setCheckIn] = useState(search.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(search.checkOut ?? "");

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
            void navigate({
              search: {
                city: city === "__all__" ? undefined : city,
                guests: guests === "__all__" ? undefined : Number(guests),
                type: type === "__all__" ? undefined : type,
                checkIn: checkIn || undefined,
                checkOut: checkOut || undefined,
              },
            });
          }}
        >
          <div className="border-b border-brand-900/10 px-4 py-3 sm:border-b-0 sm:border-r">
            <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              City
            </span>
            <StaySelect
              id="properties-city"
              value={city}
              onValueChange={setCity}
              options={[
                { value: "__all__", label: "All cities" },
                ...GUEST_CITIES.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <StayDateRange
            checkIn={checkIn}
            checkOut={checkOut}
            minDate={defaults.checkIn}
            onCheckIn={setCheckIn}
            onCheckOut={setCheckOut}
            inId="properties-check-in"
            outId="properties-check-out"
            showDash={false}
            clusterClassName="grid grid-cols-2 border-b border-brand-900/10 sm:border-b-0 sm:border-r"
            fieldClassName="px-4 py-3 text-left first:border-r first:border-brand-900/10"
            labelClassName="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45"
            valueClassName="mt-1 flex min-h-11 items-center text-[1rem] font-medium text-brand-900 sm:min-h-0 sm:text-[0.875rem]"
          />
          <div className="border-b border-brand-900/10 px-4 py-3 sm:border-b-0 sm:border-r">
            <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              Type
            </span>
            <StaySelect
              id="properties-type"
              value={type}
              onValueChange={setType}
              options={[
                { value: "__all__", label: "All types" },
                ...GUEST_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>
          <div className="border-b border-brand-900/10 px-4 py-3 sm:border-b-0 sm:border-r">
            <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              Guests
            </span>
            <StaySelect
              id="properties-guests"
              value={guests}
              onValueChange={setGuests}
              options={[
                { value: "__all__", label: "Any" },
                ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n}+` })),
              ]}
            />
          </div>
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
