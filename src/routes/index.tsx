import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroVideo from "../assets/hero-bg.mp4.asset.json";
import heroVideoWebm from "../assets/hero-bg.webm.asset.json";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PropertyCard } from "@/components/properties/property-card";
import { getWhatsAppNumber } from "@/lib/env";
import { listPublishedProperties } from "@/lib/properties";
import type { Property } from "@/types/domain";

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

const HERO_POSTER =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

function Index() {
  const navigate = useNavigate();
  const wa = getWhatsAppNumber();
  const [properties, setProperties] = useState<Property[]>([]);
  const [city, setCity] = useState("Accra");
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    void listPublishedProperties()
      .then(({ properties: list }) => setProperties(list))
      .catch(() => setProperties([]));
  }, []);

  const featured = properties.filter((p) => p.is_featured).slice(0, 4);
  const featuredFallback = featured.length ? featured : properties.slice(0, 4);

  return (
    <div className="guest-site bg-[#F7F5F2] text-brand-900">
      <div
        aria-hidden
        className="hidden"
        dangerouslySetInnerHTML={{
          __html: `<!--
THESIS: Stay Cinema + Reception Desk — full-bleed managed-stay film with a quiet desk below; refuses Airbnb marketplace chrome.
OWN-WORLD: Hero video plane; paper cream chrome; royal CTAs; gold as hairline emphasis only; Bricolage display + Source Sans 3; alternating editorial property plates.
STORY: Business traveler trusts MOJO’s curated Ghana stays, browses specific properties, Requests to Book, can WhatsApp.
FIRST VIEWPORT: Centered cinema MOJO on video; one clarity line; Browse stays + WhatsApp; slim city/guests desk strip — no dead date cell.
FORM: Stay Cinema + Reception Desk (seed 4e711582 · candidate 7); comps A+B+C.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
        }}
      />

      <SiteNav />

      <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden pt-16">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER}
          aria-hidden
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          <source src={heroVideoWebm.url} type="video/webm" />
          <source src={heroVideo.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-900 via-brand-900/50 to-brand-900/30" />

        <div className="relative z-20 flex flex-1 flex-col">
          <div className="guest-cinema-brand mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 text-center md:px-6">
            <p className="font-[family-name:var(--font-guest-display)] text-[clamp(2.75rem,8vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-white">
              MOJO
              <span className="text-gold"> Apartments</span>
            </p>
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/85 md:text-[1.125rem]">
              Trusted, managed stays across Ghana — specific homes, not a marketplace. Request to
              Book; our team confirms.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/properties"
                className="inline-flex items-center justify-center rounded-lg bg-royal px-5 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
              >
                Browse stays
              </Link>
              {wa ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-[0.9375rem] font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  <iconify-icon icon="solar:chat-round-dots-linear" width="16" />
                  WhatsApp
                </a>
              ) : (
                <Link
                  to="/support"
                  className="inline-flex items-center justify-center rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-[0.9375rem] font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  Contact
                </Link>
              )}
            </div>
          </div>

          <form
            className="guest-cinema-desk mx-auto mb-8 w-full max-w-4xl px-5 md:mb-10 md:px-6"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: "/properties", search: { city, guests } });
            }}
          >
            <div className="grid overflow-hidden rounded-xl border border-white/20 bg-[rgba(20,12,36,0.72)] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:grid-cols-[1fr_1fr_auto]">
              <label className="flex items-center gap-3 border-b border-white/15 px-4 py-3.5 sm:border-b-0 sm:border-r">
                <iconify-icon
                  icon="solar:map-point-linear"
                  width="18"
                  className="shrink-0 text-gold"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-white/45">
                    City
                  </span>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full cursor-pointer appearance-none bg-transparent text-[0.9375rem] font-medium text-white outline-none"
                  >
                    {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                      <option key={c} value={c} className="bg-brand-900 text-white">
                        {c}, Ghana
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="flex items-center gap-3 border-b border-white/15 px-4 py-3.5 sm:border-b-0 sm:border-r">
                <iconify-icon
                  icon="solar:users-group-rounded-linear"
                  width="18"
                  className="shrink-0 text-gold"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-white/45">
                    Guests
                  </span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="mt-1 w-full cursor-pointer appearance-none bg-transparent text-[0.9375rem] font-medium text-white outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n} className="bg-brand-900 text-white">
                        {n}+
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-royal px-6 py-3.5 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
              >
                <iconify-icon icon="solar:magnifer-linear" width="18" />
                Search stays
              </button>
            </div>
          </form>
        </div>
      </section>

      <section id="properties" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
                Managed stays across Ghana
              </h2>
              <p className="mt-2 text-[1.0625rem] text-brand-900/60">
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

        {featuredFallback.length === 0 ? (
          <p className="mx-auto max-w-7xl border border-dashed border-brand-900/15 px-6 py-16 text-center text-[1rem] text-brand-900/50 md:mx-6">
            No published stays yet. Check back soon, or message us on WhatsApp.
          </p>
        ) : (
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:gap-8 md:px-6">
            {featuredFallback.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-brand-900/10 bg-[#FBFaf7] px-5 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
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
                <h3 className="text-[1.125rem] font-semibold text-brand-900">{step.t}</h3>
                <p className="mt-2 text-[1rem] leading-relaxed text-brand-900/65">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
            Ready when you are
          </h2>
          <p className="mt-3 text-[1.0625rem] text-brand-900/60">
            Find a managed stay, request dates, and talk to us if you need help choosing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/properties"
              className="inline-flex rounded-lg bg-royal px-5 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
            >
              Browse stays
            </Link>
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60"
              >
                <iconify-icon icon="solar:chat-round-dots-linear" width="16" />
                WhatsApp
              </a>
            ) : (
              <Link
                to="/support"
                className="inline-flex rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60"
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
