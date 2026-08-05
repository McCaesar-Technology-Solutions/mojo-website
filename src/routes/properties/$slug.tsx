import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
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
        content: loaderData?.property?.description ?? "Premium MOJO stay in Ghana.",
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
      <div className="min-h-screen bg-brand-50">
        <SiteNav />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-light">Property not found</h1>
          <Link to="/properties" className="mt-4 inline-block text-gold underline">
            Back to properties
          </Link>
        </div>
      </div>
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
    <div className="bg-brand-50 text-brand-900 font-sans">
      <SiteNav />
      <main className="pt-24 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-gray-500 flex items-center gap-2 mb-6">
            <Link to="/" className="hover:text-gold">
              Home
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" width="12" />
            <Link to="/properties" className="hover:text-gold">
              Accommodation
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" width="12" />
            <span className="text-brand-900 font-medium">{property.title}</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-brand-900">{property.title}</h1>
              <p className="mt-2 text-gray-600 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <iconify-icon
                    icon="solar:map-point-bold"
                    width="16"
                    style={{ color: "#C89B2C" }}
                  />
                  {locationLabel(property.city, property.area)}
                </span>
                {property.rating != null && (
                  <span className="flex items-center gap-1">
                    <iconify-icon icon="solar:star-bold" width="16" style={{ color: "#C89B2C" }} />
                    {property.rating} ({property.review_count} reviews)
                  </span>
                )}
                <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-lavender text-royal">
                  Request to Book
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void toggleWishlist(property)}
                className="px-4 py-2 rounded-full border border-brand-900/15 text-sm flex items-center gap-2 hover:bg-lavender transition"
              >
                <iconify-icon icon={saved ? "solar:heart-bold" : "solar:heart-linear"} width="16" />
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 h-auto md:h-[520px] rounded-2xl overflow-hidden">
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden group">
              <img
                src={main}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {(thumbs.length ? thumbs : [{ url: main }]).map((t, i) => (
              <div key={i} className="relative overflow-hidden group min-h-[160px]">
                <img
                  src={t.url}
                  alt={`${property.title} ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {i === 3 && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full bg-white/95 text-sm font-medium text-brand-900 flex items-center gap-2">
                      <iconify-icon icon="solar:gallery-linear" width="16" />
                      View all photos
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div>
                <h2 className="text-2xl font-light text-brand-900">Hosted by MOJO Concierge</h2>
                <p className="mt-3 text-gray-600 leading-relaxed">{property.description}</p>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                    <div
                      key={x.l}
                      className="p-4 rounded-xl bg-white shadow-md ring-1 ring-brand-900/5 hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                      <iconify-icon icon={x.i} width="22" style={{ color: "#C89B2C" }} />
                      <p className="mt-2 text-sm font-medium text-brand-900">{x.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-brand-900 mb-6">Amenities</h2>
                <div className="relative border-l border-brand-900/10">
                  {amenities.map((a, i) => (
                    <div
                      key={a.id}
                      className={`relative pl-6 ${i === amenities.length - 1 ? "" : "pb-5"}`}
                    >
                      <span
                        className={`absolute left-0 -translate-x-1/2 top-1 w-3 h-3 rounded-full ${
                          i === 0 ? "bg-gold" : "border border-brand-900/20 bg-white"
                        }`}
                      />
                      <div className="flex items-center gap-3">
                        <iconify-icon
                          icon={a.icon}
                          width="20"
                          style={{ color: i === 0 ? "#C89B2C" : "#24104D" }}
                        />
                        <span
                          className={`text-sm ${i === 0 ? "font-medium text-brand-900" : "text-gray-700"}`}
                        >
                          {a.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(property.policies?.length ?? 0) > 0 && (
                <div>
                  <h2 className="text-2xl font-light text-brand-900 mb-4">Policies</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {property.policies.map((p) => (
                      <div
                        key={p.title}
                        className="p-5 rounded-xl bg-white shadow-md ring-1 ring-brand-900/5 hover:shadow-lg hover:-translate-y-0.5 transition"
                      >
                        <iconify-icon icon={p.icon} width="22" style={{ color: "#2D1659" }} />
                        <h3 className="mt-2 font-medium text-brand-900">{p.title}</h3>
                        <p className="text-sm text-gray-600">{p.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(property.house_rules?.length ?? 0) > 0 && (
                <div>
                  <h2 className="text-2xl font-light text-brand-900 mb-4">House Rules</h2>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {property.house_rules.map((r) => (
                      <li key={r} className="flex items-start gap-2">
                        <iconify-icon
                          icon="solar:check-circle-bold"
                          width="18"
                          style={{ color: "#C89B2C" }}
                        />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 z-10 bg-white border border-brand-900/10 rounded-2xl shadow-lg p-6">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-semibold text-brand-900">{ghs(nightly)}</span>
                  {property.pricing?.original_nightly_rate ? (
                    <span className="text-sm text-gray-400 line-through underline-offset-4">
                      {ghs(property.pricing.original_nightly_rate)}
                    </span>
                  ) : null}
                  <span className="text-sm text-gray-500">/ night</span>
                </div>

                <div className="mt-5 grid grid-cols-2 border border-brand-900/10 rounded-xl overflow-hidden">
                  <label className="p-3 border-r border-brand-900/10 cursor-text block">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      Check-in
                    </div>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => {
                        if (!dateBlocked(e.target.value)) setCheckIn(e.target.value);
                      }}
                      className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none"
                    />
                  </label>
                  <label className="p-3 cursor-text block">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      Check-out
                    </div>
                    <input
                      type="date"
                      min={checkIn}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none"
                    />
                  </label>
                </div>
                {blocked.length > 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    Some dates are unavailable on this calendar.
                  </p>
                )}

                <div className="mt-3 border border-brand-900/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                    Guests
                  </div>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="mt-1 bg-transparent text-sm font-medium focus:outline-none w-full"
                  >
                    {Array.from({ length: property.max_guests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Adult" : "Adults"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>
                      {ghs(nightly)} × {nights} {nights === 1 ? "night" : "nights"}
                    </span>
                    <span>{ghs(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>{ghs(nights > 0 ? cleaning : 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>{ghs(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-brand-900/10 font-semibold text-brand-900 text-base">
                    <span>Total</span>
                    <span>{ghs(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setEnquiryOpen(true)}
                  disabled={nights <= 0}
                  className="mt-5 w-full py-3 rounded-full bg-royal text-white font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40"
                >
                  Request to Book
                </button>
                <p className="mt-3 text-xs text-center text-gray-500">
                  You won&apos;t be charged yet — our team confirms availability. See{" "}
                  <Link to="/cancellation" className="underline">
                    cancellation
                  </Link>{" "}
                  &{" "}
                  <Link to="/terms" className="underline">
                    terms
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />

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
    </div>
  );
}
