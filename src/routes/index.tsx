import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroSlide1 from "../assets/hero/slide-1.jpg";
import heroSlide2 from "../assets/hero/slide-2.jpg";
import heroSlide3 from "../assets/hero/slide-3.jpg";
import heroSlide4 from "../assets/hero/slide-4.jpg";
import heroSlide5 from "../assets/hero/slide-5.jpg";
import heroSlide6 from "../assets/hero/slide-6.jpg";
import heroSlide7 from "../assets/hero/slide-7.jpg";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PropertyCard } from "@/components/properties/property-card";
import { getWhatsAppNumber } from "@/lib/env";
import { defaultStayDates, toDateInputValue } from "@/lib/format";
import {
  CatalogEmpty,
  CatalogLoading,
  CatalogUnavailable,
} from "@/components/properties/catalog-status";
import { usePublishedProperties } from "@/lib/use-published-properties";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MOJO Apartments | Premium Managed Stays in Ghana" },
      {
        name: "description",
        content:
          "Trusted apartments and hotels managed by MOJO across Ghana. Request to Book — our team confirms your stay.",
      },
      { property: "og:title", content: "MOJO Apartments | Premium Managed Stays in Ghana" },
      {
        property: "og:description",
        content:
          "Trusted apartments and hotels managed by MOJO across Ghana. Request to Book — our team confirms your stay.",
      },
      { property: "og:image", content: "/icons/icon-512.png" },
    ],
  }),
  component: Index,
});

const HERO_SLIDES = [
  heroSlide1,
  heroSlide2,
  heroSlide3,
  heroSlide4,
  heroSlide5,
  heroSlide6,
  heroSlide7,
];

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="absolute inset-0 z-0" aria-hidden>
      {HERO_SLIDES.map((src, slideIndex) => (
        <img
          key={src}
          src={src}
          alt=""
          fetchPriority={slideIndex === 0 ? "high" : "low"}
          loading={slideIndex === 0 ? "eager" : "lazy"}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-[72%_center] ${
            reduceMotion ? "" : "transition-opacity duration-1000 ease-in-out"
          } ${slideIndex === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}

function Index() {
  const navigate = useNavigate();
  const wa = getWhatsAppNumber();
  const { properties, loading, error, retry } = usePublishedProperties();
  const [city, setCity] = useState("Accra");
  const [guests, setGuests] = useState(2);
  const defaults = defaultStayDates();
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);

  const featured = properties.filter((p) => p.is_featured).slice(0, 4);
  const featuredFallback = featured.length ? featured : properties.slice(0, 4);

  return (
    <div className="guest-site bg-[#F7F5F2] text-brand-900">
      <div
        aria-hidden
        className="hidden"
        dangerouslySetInnerHTML={{
          __html: `<!--
THESIS: Stay Stage + Reception Desk — full-bleed media stage; MOJO logo and palette kept.
OWN-WORLD: Edge-to-edge hero; right-weighted stay media; paper chrome; royal CTAs; gold as hairline emphasis only; Marcellus headings + Poppins body; alternating editorial property plates.
STORY: Business traveler trusts MOJO’s curated Ghana stays, browses specific properties, Requests to Book, can WhatsApp.
FIRST VIEWPORT: Full-bleed media stage; centered Marcellus headline + Poppins subline; frosted City / dates / Guests search bar; settle motion + focusable controls.
FORM: Reference-layout shell with MOJO identity.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
        }}
      />

      <SiteNav />

      <section className="w-full pt-16">
        <div className="guest-cinema-stage relative flex min-h-[calc(100svh-4rem)] w-full flex-col overflow-hidden">
          <HeroSlideshow />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-black/55" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.28),transparent_68%)]"
          />

          <div className="relative z-20 flex min-h-[inherit] flex-1 flex-col">
            <div className="guest-cinema-brand flex w-full flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-8 md:px-12 lg:px-14">
              <h1 className="max-w-[22ch] font-[family-name:var(--font-guest-display)] text-[clamp(3.5rem,8vw,6rem)] font-normal leading-[1.15] tracking-[0.02em] text-white">
                <span className="block">MOJO stays</span>
                <span className="block">across Ghana</span>
              </h1>
              <div className="mx-auto mt-5 h-px w-16 bg-gold" aria-hidden />
              <p className="mt-6 max-w-xl text-[clamp(1.25rem,1.8vw,1.5rem)] font-normal leading-[1.45] tracking-[0.01em] text-white">
                Specific managed apartments and hotels — Request to Book; our team confirms.
              </p>
            </div>

            <form
              className="guest-cinema-desk mt-auto w-full px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8"
              aria-label="Search stays"
              onSubmit={(e) => {
                e.preventDefault();
                void navigate({
                  to: "/properties",
                  search: { city, guests, checkIn, checkOut },
                });
              }}
            >
              <div className="grid grid-cols-2 items-stretch gap-2 rounded-[1.25rem] border border-white/70 bg-[#FBFaf7]/88 p-2.5 shadow-[0_8px_32px_rgba(36,16,77,0.12)] backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,0.9fr)_auto] sm:gap-0 sm:rounded-[1.5rem] sm:p-2 sm:pl-4 md:p-2.5 md:pl-5">
                <label
                  htmlFor="hero-search-city"
                  className="flex min-w-0 flex-col justify-center rounded-lg bg-white/50 px-3 py-2 sm:rounded-none sm:border-r sm:border-brand-900/10 sm:bg-transparent sm:px-4 sm:py-3"
                >
                  <span className="text-[0.75rem] font-bold leading-none text-brand-900 sm:text-[0.8125rem]">
                    City
                  </span>
                  <span className="mt-1 flex min-h-11 items-center gap-1.5 text-brand-900/60 sm:min-h-0 sm:gap-2">
                    <iconify-icon
                      icon="solar:magnifer-linear"
                      width="18"
                      className="hidden shrink-0 sm:block"
                      aria-hidden
                    />
                    <select
                      id="hero-search-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="min-h-11 min-w-0 flex-1 cursor-pointer appearance-none rounded-md bg-transparent text-[1rem] font-medium leading-tight tracking-[-0.01em] text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFaf7] sm:min-h-0"
                    >
                      {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <iconify-icon
                      icon="solar:alt-arrow-down-linear"
                      width="16"
                      className="shrink-0 text-brand-900/45"
                      aria-hidden
                    />
                  </span>
                </label>
                <label
                  htmlFor="hero-search-guests"
                  className="flex min-w-0 flex-col justify-center rounded-lg bg-white/50 px-3 py-2 sm:order-3 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-3"
                >
                  <span className="text-[0.75rem] font-bold leading-none text-brand-900 sm:text-[0.8125rem]">
                    Guests
                  </span>
                  <span className="mt-1 flex min-h-11 items-center gap-1.5 text-brand-900/60 sm:min-h-0 sm:gap-2">
                    <iconify-icon
                      icon="solar:users-group-rounded-linear"
                      width="18"
                      className="hidden shrink-0 sm:block"
                      aria-hidden
                    />
                    <select
                      id="hero-search-guests"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="min-h-11 min-w-0 flex-1 cursor-pointer appearance-none rounded-md bg-transparent text-[1rem] font-medium leading-tight tracking-[-0.01em] text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFaf7] sm:min-h-0"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "guest" : "guests"}
                        </option>
                      ))}
                    </select>
                    <iconify-icon
                      icon="solar:alt-arrow-down-linear"
                      width="16"
                      className="shrink-0 text-brand-900/45"
                      aria-hidden
                    />
                  </span>
                </label>
                <div className="col-span-2 grid grid-cols-2 gap-2 sm:order-2 sm:col-span-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-0 sm:rounded-none sm:border-r sm:border-brand-900/10 sm:px-4 sm:py-3">
                  <label
                    htmlFor="hero-search-check-in"
                    className="flex min-w-0 flex-col justify-center rounded-lg bg-white/50 px-3 py-2 sm:bg-transparent sm:p-0"
                  >
                    <span className="text-[0.75rem] font-bold leading-none text-brand-900 sm:text-[0.8125rem]">
                      Check in
                    </span>
                    <span className="mt-1 flex min-h-11 items-center gap-1.5 text-brand-900/60 sm:min-h-0">
                      <iconify-icon
                        icon="solar:calendar-linear"
                        width="18"
                        className="hidden shrink-0 sm:block"
                        aria-hidden
                      />
                      <input
                        id="hero-search-check-in"
                        type="date"
                        value={checkIn}
                        min={defaults.checkIn}
                        onChange={(e) => {
                          const next = e.target.value;
                          setCheckIn(next);
                          if (checkOut && next >= checkOut) {
                            const day = new Date(`${next}T00:00:00`);
                            day.setDate(day.getDate() + 1);
                            setCheckOut(toDateInputValue(day));
                          }
                        }}
                        className="min-h-11 min-w-0 flex-1 cursor-pointer rounded-md bg-transparent text-[1rem] font-medium leading-tight tracking-[-0.01em] text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFaf7] sm:min-h-0"
                      />
                    </span>
                  </label>
                  <span
                    className="hidden items-end pb-2 text-brand-900/35 sm:flex"
                    aria-hidden
                  >
                    –
                  </span>
                  <label
                    htmlFor="hero-search-check-out"
                    className="flex min-w-0 flex-col justify-center rounded-lg bg-white/50 px-3 py-2 sm:bg-transparent sm:p-0"
                  >
                    <span className="text-[0.75rem] font-bold leading-none text-brand-900 sm:text-[0.8125rem]">
                      Check out
                    </span>
                    <input
                      id="hero-search-check-out"
                      type="date"
                      value={checkOut}
                      min={checkIn || defaults.checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="mt-1 min-h-11 min-w-0 w-full cursor-pointer rounded-md bg-transparent text-[1rem] font-medium leading-tight tracking-[-0.01em] text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFaf7] sm:min-h-0"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="col-span-2 flex min-h-11 w-full items-center justify-center rounded-lg bg-royal px-5 text-[1rem] font-bold tracking-[-0.01em] text-white transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFaf7] sm:order-4 sm:col-span-1 sm:w-auto sm:self-stretch sm:rounded-[1.15rem] sm:px-8"
                >
                  Search stays
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section id="properties" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-normal tracking-[-0.02em] text-brand-900">
                Managed stays across Ghana
              </h2>
              <p className="mt-2 text-[1.0625rem] text-brand-900/70">
                Specific apartments and hotels we operate — request a stay and we confirm
                availability.
              </p>
            </div>
            <Link
              to="/properties"
              className="text-[0.9375rem] font-medium text-royal underline decoration-gold/70 underline-offset-4 hover:decoration-royal"
            >
              View all properties
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mx-auto max-w-7xl px-5 md:px-6">
            <CatalogLoading />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-7xl px-5 md:px-6">
            <CatalogUnavailable onRetry={retry} />
          </div>
        ) : featuredFallback.length === 0 ? (
          <div className="mx-auto max-w-7xl px-5 md:px-6">
            <CatalogEmpty>
              No published stays yet. Check back soon
              {wa ? ", or message us on WhatsApp" : ""}.
            </CatalogEmpty>
          </div>
        ) : (
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:gap-8 md:px-6">
            {featuredFallback.map((p, i) => (
              <PropertyCard
                key={p.id}
                property={p}
                index={i}
                stay={{ checkIn, checkOut, guests }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-brand-900/10 bg-[#FBFaf7] px-5 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-normal tracking-[-0.02em] text-brand-900">
            How Request to Book works
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              {
                t: "Choose a stay",
                d: "Browse MOJO-managed properties in Accra, Kumasi, Takoradi, and Tema.",
              },
              {
                t: "Send a request",
                d: "Share your dates and guests. You’re not charged when you submit.",
              },
              {
                t: "We confirm",
                d: "Our team checks availability — usually within 24 hours — then follows up, including WhatsApp.",
              },
            ].map((step) => (
              <li key={step.t} className="border-t border-gold/70 pt-5">
                <h3 className="font-[family-name:var(--font-guest-display)] text-[1.125rem] font-normal tracking-[0.01em] text-brand-900">
                  {step.t}
                </h3>
                <p className="mt-2 text-[1rem] leading-relaxed text-brand-900/70">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-normal tracking-[-0.02em] text-brand-900">
            Ready when you are
          </h2>
          <p className="mt-3 text-[1.0625rem] text-brand-900/70">
            Find a managed stay, request dates, and talk to us if you need help choosing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/properties"
              className="inline-flex min-h-11 items-center rounded-lg bg-royal px-5 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F2]"
            >
              Browse stays
            </Link>
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F2]"
              >
                <iconify-icon icon="solar:chat-round-dots-linear" width="16" />
                WhatsApp
              </a>
            ) : (
              <Link
                to="/support"
                className="inline-flex min-h-11 items-center rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F2]"
              >
                Contact
              </Link>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: "MOJO Apartments",
            description: "Premium apartments and hotels thoughtfully managed across Ghana.",
            areaServed: "Ghana",
            url: "https://mojoapartments.com",
            logo: "https://mojoapartments.com/logo.svg",
            image: "https://mojoapartments.com/icons/icon-512.png",
          }),
        }}
      />
    </div>
  );
}
