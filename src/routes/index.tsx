import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroVideo from "../assets/hero-bg.mp4.asset.json";
import heroVideoWebm from "../assets/hero-bg.webm.asset.json";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PropertyCard } from "@/components/properties/property-card";
import { DEMO_TESTIMONIALS } from "@/data/demo-properties";
import { listPublishedProperties } from "@/lib/properties";
import type { Property } from "@/types/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MOJO Apartments | Premium Property & Hotel Booking" },
      {
        name: "description",
        content: "Discover premium apartments and hotels thoughtfully managed across Ghana.",
      },
      { property: "og:title", content: "MOJO Apartments | Premium Property & Hotel Booking" },
      {
        property: "og:description",
        content: "Discover premium apartments and hotels thoughtfully managed across Ghana.",
      },
      {
        property: "og:image",
        content:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      },
    ],
  }),
  component: Index,
});

const HERO_BG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

function Index() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [city, setCity] = useState("Accra");
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    void listPublishedProperties().then(({ properties: list }) => setProperties(list));
  }, []);

  const featured = properties.filter((p) => p.is_featured).slice(0, 4);
  const curated = properties.filter((p) => p.pricing?.discount_label).slice(0, 4);
  const featuredFallback = featured.length ? featured : properties.slice(0, 4);
  const curatedFallback = curated.length ? curated : properties.slice(0, 4);

  return (
    <div className="bg-brand-50 text-brand-900 font-sans">
      <SiteNav />

      <section id="home" className="relative h-screen min-h-[600px] w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_BG}
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={heroVideoWebm.url} type="video/webm" />
          <source src={heroVideo.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 z-10" />
        <div className="relative z-20 max-w-6xl mx-auto h-full flex flex-col justify-center items-center text-center px-6 pt-16">
          <h1 className="text-white text-4xl md:text-6xl font-light leading-tight max-w-4xl">
            Your Perfect Stay Begins with{" "}
            <span className="text-gold font-normal">MOJO Apartments.</span>
          </h1>
          <p className="mt-6 text-white/90 text-lg md:text-xl font-light max-w-2xl">
            Discover premium apartments and hotels thoughtfully managed across Ghana.
          </p>

          <form
            className="mt-12 w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row items-stretch gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: "/properties", search: { city, guests } });
            }}
          >
            <label className="group flex-1 cursor-text flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition">
              <iconify-icon icon="solar:map-point-linear" width="22" style={{ color: "#C89B2C" }} />
              <div className="text-left w-full">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                  Location
                </div>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-sm text-brand-900 font-medium bg-transparent w-full focus:outline-none"
                >
                  {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                    <option key={c} value={c}>
                      {c}, Ghana
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <div className="group flex-1 cursor-text flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition">
              <iconify-icon icon="solar:calendar-linear" width="22" style={{ color: "#C89B2C" }} />
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                  Check-in / Check-out
                </div>
                <div className="text-sm text-brand-900 font-medium">Add dates on listing</div>
              </div>
            </div>
            <label className="group flex-1 cursor-text flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition">
              <iconify-icon
                icon="solar:users-group-rounded-linear"
                width="22"
                style={{ color: "#C89B2C" }}
              />
              <div className="text-left w-full">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                  Guests
                </div>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="text-sm text-brand-900 font-medium bg-transparent w-full focus:outline-none"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} Adults
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <button
              type="submit"
              className="bg-royal text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <iconify-icon icon="solar:magnifer-linear" width="18" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      <section id="properties" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-gold text-sm uppercase tracking-widest font-medium">Featured</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-light text-brand-900">
                Premium Properties Across Ghana
              </h2>
            </div>
            <Link
              to="/properties"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-brand-900 hover:text-gold transition"
            >
              View all <iconify-icon icon="solar:arrow-right-linear" width="16" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFallback.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="accommodation"
        className="py-24 px-6 bg-lavender border-y border-brand-900/5 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold text-sm uppercase tracking-widest font-medium">Curated</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-light text-brand-900">
              Hotel Stays for Every Occasion
            </h2>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">
              Hand-picked hotel partners with exclusive MOJO member rates.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {curatedFallback.map((p) => (
              <PropertyCard key={p.id} property={p} showDiscount />
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 px-6 bg-lavender scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold text-sm uppercase tracking-widest font-medium">
              Loved by Guests
            </p>
            <h2 className="mt-2 text-3xl md:text-4xl font-light text-brand-900">
              What Our Guests Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {DEMO_TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white shadow-lg hover:shadow-2xl ring-1 ring-brand-900/5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <iconify-icon
                      key={i}
                      icon="solar:star-bold"
                      width="16"
                      style={{ color: "#C89B2C" }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-gray-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-brand-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-6 bg-white scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light text-brand-900">
            Ready to experience MOJO?
          </h2>
          <p className="mt-3 text-gray-600">
            Create an account to unlock member rates and save your favourite stays.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth/sign-up"
              className="px-6 py-3 rounded-full bg-royal text-white font-medium hover:opacity-90 transition"
            >
              Create Account
            </Link>
            <Link
              to="/auth/sign-in"
              className="px-6 py-3 rounded-full border border-brand-900/15 font-medium hover:bg-lavender transition"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 grayscale opacity-70">
            <iconify-icon icon="logos:visa" width="48" />
            <iconify-icon icon="logos:mastercard" width="48" />
            <iconify-icon icon="logos:amex" width="48" />
            <iconify-icon icon="logos:paypal" width="48" />
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
          }),
        }}
      />
    </div>
  );
}
