import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GuestShell } from "@/components/layout/guest-shell";
import { EnquiryModal } from "@/components/booking/enquiry-modal";
import { getBlockedDates, getPropertyBySlug, coverUrl } from "@/lib/properties";
import { calcStayTotal, ghs, locationLabel, nightsBetween } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { Property } from "@/types/domain";

export const Route = createFileRoute("/properties/$slug")({
  loader: async ({ params }) => {
    try {
      const { property, source } = await getPropertyBySlug(params.slug);
      return { property, source };
    } catch {
      return { property: null, source: "supabase" as const };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.property
          ? `${loaderData.property.title} | MOJO Apartments`
          : "Property | MOJO Apartments",
      },
      {
        name: "description",
        content: loaderData?.property?.description ?? "MOJO-managed stay in Ghana.",
      },
      {
        property: "og:image",
        content: loaderData?.property ? coverUrl(loaderData.property) : undefined,
      },
    ],
  }),
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { property: initial } = Route.useLoaderData();
  const { user } = useAuth();
  const [property] = useState<Property | null>(initial);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!property) return;
    void getBlockedDates(property.id).then(setBlocked);
    document.body.style.overflow = enquiryOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [property, enquiryOpen]);

  if (!property) {
    return (
      <GuestShell mainClassName="pt-28 text-center">
        <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em]">
          Property not found
        </h1>
        <Link
          to="/properties"
          className="mt-4 inline-block text-[0.9375rem] font-medium text-royal underline decoration-gold/70 underline-offset-4"
        >
          Back to properties
        </Link>
      </GuestShell>
    );
  }

  const media = property.media ?? [];
  const main = media[0]?.url ?? coverUrl(property);
  const thumbs = media.slice(1, 5);
  const amenities = property.amenities ?? [];
  const nightly = property.pricing?.nightly_rate ?? 0;
  const cleaning = property.pricing?.cleaning_fee ?? 0;
  const rate = property.pricing?.service_fee_rate ?? 0.046875;
  const nights = nightsBetween(checkIn, checkOut);
  const { subtotal, serviceFee, total } = calcStayTotal(nightly, nights, cleaning, rate);

  const dateBlocked = (d: string) => blocked.includes(d);

  async function toggleWishlist(current: Property) {
    const supabase = getSupabase();
    if (!supabase || !user) {
      window.location.href = "/auth/sign-in";
      return;
    }
    if (saved) {
      await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", current.id);
      setSaved(false);
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, property_id: current.id });
      setSaved(true);
    }
  }

  return (
    <GuestShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[0.875rem] text-brand-900/50">
          <Link to="/" className="hover:text-royal">
            Home
          </Link>
          <iconify-icon icon="solar:alt-arrow-right-linear" width="12" />
          <Link to="/properties" className="hover:text-royal">
            Properties
          </Link>
          <iconify-icon icon="solar:alt-arrow-right-linear" width="12" />
          <span className="font-medium text-brand-900">{property.title}</span>
        </div>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
              {property.title}
            </h1>
            <div className="mt-3 h-px w-12 bg-gold" aria-hidden />
            <p className="mt-4 flex flex-wrap items-center gap-4 text-[1rem] text-brand-900/60">
              <span className="flex items-center gap-1">
                <iconify-icon icon="solar:map-point-linear" width="16" className="text-royal" />
                {locationLabel(property.city, property.area)}
              </span>
              {property.rating != null ? (
                <span className="flex items-center gap-1">
                  <iconify-icon icon="solar:star-bold" width="16" className="text-gold" />
                  {property.rating} ({property.review_count} reviews)
                </span>
              ) : null}
              <span className="rounded-md bg-lavender px-2 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-royal">
                Request to Book
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleWishlist(property)}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-900/15 bg-white px-4 py-2 text-[0.9375rem] font-medium transition hover:bg-lavender/60"
          >
            <iconify-icon icon={saved ? "solar:heart-bold" : "solar:heart-linear"} width="16" />
            {saved ? "Saved" : "Save"}
          </button>
        </div>

        <div className="grid h-auto grid-cols-1 gap-2 overflow-hidden md:h-[520px] md:grid-cols-4 md:grid-rows-2">
          <div className="group relative overflow-hidden md:col-span-2 md:row-span-2">
            <img
              src={main}
              alt={property.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          </div>
          {(thumbs.length ? thumbs : [{ url: main }]).map((t, i) => (
            <div key={i} className="group relative min-h-[160px] overflow-hidden">
              <img
                src={t.url}
                alt={`${property.title} ${i + 1}`}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <div>
              <h2 className="font-[family-name:var(--font-guest-display)] text-[1.5rem] font-medium tracking-[-0.02em] text-brand-900">
                Managed by MOJO
              </h2>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-brand-900/65">
                {property.description}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { i: "solar:bed-linear", l: `${property.bedrooms} Bedrooms` },
                  { i: "solar:bath-linear", l: `${property.bathrooms} Bathrooms` },
                  {
                    i: "solar:users-group-rounded-linear",
                    l: `Up to ${property.max_guests} guests`,
                  },
                  {
                    i: "solar:ruler-linear",
                    l: property.size_sqm ? `${property.size_sqm} m²` : "Spacious",
                  },
                ].map((x) => (
                  <div key={x.l} className="border border-brand-900/10 bg-[#FBFaf7] px-4 py-4">
                    <iconify-icon icon={x.i} width="20" className="text-royal" />
                    <p className="mt-2 text-[0.875rem] font-medium text-brand-900">{x.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {amenities.length > 0 ? (
              <div>
                <h2 className="font-[family-name:var(--font-guest-display)] text-[1.5rem] font-medium tracking-[-0.02em] text-brand-900">
                  Amenities
                </h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {amenities.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 border-t border-brand-900/10 pt-3 text-[1rem] text-brand-900/75"
                    >
                      <iconify-icon icon={a.icon} width="18" className="text-royal" />
                      {a.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(property.policies?.length ?? 0) > 0 ? (
              <div>
                <h2 className="font-[family-name:var(--font-guest-display)] text-[1.5rem] font-medium tracking-[-0.02em] text-brand-900">
                  Policies
                </h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {property.policies.map((p) => (
                    <div
                      key={p.title}
                      className="border border-brand-900/10 bg-[#FBFaf7] px-5 py-4"
                    >
                      <iconify-icon icon={p.icon} width="20" className="text-royal" />
                      <h3 className="mt-2 text-[1rem] font-medium text-brand-900">{p.title}</h3>
                      <p className="mt-1 text-[0.875rem] text-brand-900/60">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(property.house_rules?.length ?? 0) > 0 ? (
              <div>
                <h2 className="font-[family-name:var(--font-guest-display)] text-[1.5rem] font-medium tracking-[-0.02em] text-brand-900">
                  House rules
                </h2>
                <ul className="mt-4 space-y-2 text-[1rem] text-brand-900/70">
                  {property.house_rules.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <iconify-icon
                        icon="solar:check-circle-bold"
                        width="18"
                        className="mt-0.5 shrink-0 text-royal"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 z-10 border border-brand-900/10 bg-[#FBFaf7] p-6">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[1.25rem] font-semibold tabular-nums text-brand-900">
                  {ghs(nightly)}
                </span>
                {property.pricing?.original_nightly_rate ? (
                  <span className="text-[0.8125rem] text-brand-900/40 line-through">
                    {ghs(property.pricing.original_nightly_rate)}
                  </span>
                ) : null}
                <span className="text-[0.8125rem] text-brand-900/50">/ night</span>
              </div>

              <div className="mt-5 grid grid-cols-2 overflow-hidden border border-brand-900/10 bg-white">
                <label className="block cursor-text border-r border-brand-900/10 p-3">
                  <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                    Check-in
                  </span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      if (!dateBlocked(e.target.value)) setCheckIn(e.target.value);
                    }}
                    className="mt-1 w-full bg-transparent text-[0.9375rem] font-medium outline-none"
                  />
                </label>
                <label className="block cursor-text p-3">
                  <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                    Check-out
                  </span>
                  <input
                    type="date"
                    min={checkIn}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="mt-1 w-full bg-transparent text-[0.9375rem] font-medium outline-none"
                  />
                </label>
              </div>
              {blocked.length > 0 ? (
                <p className="mt-2 text-[0.8125rem] text-brand-900/55">
                  Some dates are unavailable on this calendar.
                </p>
              ) : null}

              <label className="mt-3 block border border-brand-900/10 bg-white p-3">
                <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                  Guests
                </span>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="mt-1 w-full appearance-none bg-transparent text-[0.9375rem] font-medium outline-none"
                >
                  {Array.from({ length: property.max_guests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-5 space-y-2 text-[0.875rem] text-brand-900/70">
                <div className="flex justify-between">
                  <span>
                    {ghs(nightly)} × {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="tabular-nums">{ghs(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span className="tabular-nums">{ghs(nights > 0 ? cleaning : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span className="tabular-nums">{ghs(serviceFee)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-900/10 pt-3 text-[1rem] font-semibold text-brand-900">
                  <span>Total</span>
                  <span className="tabular-nums">{ghs(total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                disabled={nights <= 0}
                className="mt-5 w-full rounded-lg bg-royal py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90 disabled:opacity-40"
              >
                Request to Book
              </button>
              <p className="mt-3 text-center text-[0.8125rem] text-brand-900/50">
                You won&apos;t be charged yet — our team confirms availability. See{" "}
                <Link
                  to="/cancellation"
                  className="underline decoration-gold/70 underline-offset-2"
                >
                  cancellation
                </Link>{" "}
                &{" "}
                <Link to="/terms" className="underline decoration-gold/70 underline-offset-2">
                  terms
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </div>

      <EnquiryModal
        property={property}
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
        onGuestsChange={setGuests}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HotelRoom",
            name: property.title,
            description: property.description,
            address: {
              "@type": "PostalAddress",
              addressLocality: property.city,
              addressCountry: "GH",
            },
          }),
        }}
      />
    </GuestShell>
  );
}
