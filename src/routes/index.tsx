import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroVideo from "../assets/hero-bg.mp4.asset.json";
import heroVideoWebm from "../assets/hero-bg.webm.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MOJO Apartments | Premium Property & Hotel Booking" },
      { name: "description", content: "Discover premium apartments and hotels thoughtfully managed across Ghana." },
      { property: "og:title", content: "MOJO Apartments | Premium Property & Hotel Booking" },
      { property: "og:description", content: "Discover premium apartments and hotels thoughtfully managed across Ghana." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" },
    ],
  }),
  component: Index,
});


const HERO_BG = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

const properties = [
  { name: "Royal Heights Residence", location: "Cantonments, Accra", price: 1850, type: "Apartment", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.9 },
  { name: "Ashanti Garden Suites", location: "Kumasi", price: 1200, type: "Apartment", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.8 },
  { name: "Harbor View Apartments", location: "Takoradi", price: 1450, type: "Hotel", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.7 },
  { name: "Port City Lofts", location: "Tema", price: 980, type: "Apartment", img: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.6 },
];

const hotels = [
  { name: "MOJO Luxury Suite", location: "Cantonments, Accra", price: 2400, original: 3000, discount: "-20% This Week", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
  { name: "Executive Garden Room", location: "Airport Residential", price: 1800, original: 2100, discount: "-15% Weekend", img: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg" },
  { name: "Serviced Apartment", location: "East Legon", price: 1500, original: 1900, discount: "-21% Monthly", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
  { name: "Corporate Suite", location: "Ridge, Accra", price: 2100, original: 2500, discount: "-16% Stay 3+", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
];

const galleryThumbs = [
  "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg",
  "https://images.unsplash.com/photo-1515859005217-8a1f08870f59?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
];

const amenities = [
  { icon: "solar:wi-fi-router-bold", label: "High-Speed Wi-Fi", highlight: true },
  { icon: "solar:bath-bold", label: "Private Bathroom" },
  { icon: "solar:chef-hat-bold", label: "Fully Equipped Kitchen" },
  { icon: "solar:snowflake-bold", label: "Central Air Conditioning" },
  { icon: "solar:tv-bold", label: "Smart TV with Netflix" },
  { icon: "solar:washing-machine-bold", label: "In-unit Washer & Dryer" },
  { icon: "solar:parking-bold", label: "Secure Parking" },
  { icon: "solar:shield-keyhole-bold", label: "24/7 Security" },
];

const testimonials = [
  { name: "Ama Boateng", role: "Frequent Traveler", quote: "MOJO made my Accra stay flawless. The Cantonments suite was pristine and the team was incredibly responsive.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop" },
  { name: "Kwame Mensah", role: "Business Executive", quote: "I book MOJO for every Kumasi trip. Consistent quality, beautiful spaces, and the booking process is effortless.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" },
  { name: "Akosua Owusu", role: "Family Vacationer", quote: "Our family of five loved the Takoradi apartment. Spacious, clean, and right by the water. We'll be back.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop" },
];

const scrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const NIGHTLY = 2400;
const CLEANING = 300;
const SERVICE_RATE = 0.046875; // GHS 450 on a 4-night stay
const ghs = (n: number) => `GHS ${Math.round(n).toLocaleString()}`;
const fmtDate = (v: string) =>
  v
    ? new Date(v + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Select date";

function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [checkIn, setCheckIn] = useState("2026-12-12");
  const [checkOut, setCheckOut] = useState("2026-12-16");
  const [guests, setGuests] = useState("2 Adults");
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const nights = Math.max(
    0,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) || 0,
  );
  const subtotal = NIGHTLY * nights;
  const serviceFee = Math.round(subtotal * SERVICE_RATE);
  const total = nights > 0 ? subtotal + CLEANING + serviceFee : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = enquiryOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [enquiryOpen]);


  return (
    <div className="bg-brand-50 text-brand-900 font-sans">
      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 h-16 backdrop-blur-md transition-all duration-300 ${scrolled ? "bg-white/90 shadow-sm" : "bg-white/80"}`}>
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <a href="#home" onClick={scrollTo("home")} className="text-2xl font-semibold uppercase tracking-tighter text-gold">MOJO</a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {[
              { label: "Accommodation", target: "accommodation" },
              { label: "Properties", target: "properties" },
            ].map((l) => (
              <div key={l.label} className="relative group">
                <a href={`#${l.target}`} onClick={scrollTo(l.target)} className="flex items-center gap-1 text-brand-900 hover:text-gold transition">
                  {l.label}
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="14" />
                </a>
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                    <a key={c} className="block px-3 py-2 text-sm hover:bg-lavender rounded-lg" href={`#${l.target}`} onClick={scrollTo(l.target)}>{c}</a>
                  ))}
                </div>
              </div>
            ))}
            <a href="#suite" onClick={scrollTo("suite")} className="text-brand-900 hover:text-gold transition">About</a>
            <a href="#contact" onClick={scrollTo("contact")} className="text-brand-900 hover:text-gold transition">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-brand-900 hover:text-gold transition" aria-label="Search">
              <iconify-icon icon="solar:magnifer-linear" width="20" />
            </button>
            <span className="hidden md:block h-5 w-px bg-gray-300" />
            <a href="#contact" onClick={scrollTo("contact")} className="hidden md:block text-sm font-medium hover:text-gold transition">Sign In</a>
            <a href="#suite" onClick={scrollTo("suite")} className="hidden md:inline-flex items-center px-4 py-2 rounded-full bg-royal text-white text-sm font-medium hover:opacity-90 transition">Book Now</a>
            <button className="relative" aria-label="Cart">
              <iconify-icon icon="solar:cart-3-linear" width="22" />
              <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">2</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
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
            Your Perfect Stay Begins with <span className="text-gold font-normal">MOJO Apartments.</span>
          </h1>
          <p className="mt-6 text-white/90 text-lg md:text-xl font-light max-w-2xl">
            Discover premium apartments and hotels thoughtfully managed across Ghana.
          </p>

          {/* Search */}
          <div className="mt-12 w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row items-stretch gap-1">
            {[
              { icon: "solar:map-point-linear", label: "Location", value: "Accra, Ghana" },
              { icon: "solar:calendar-linear", label: "Check-in / Check-out", value: "Add dates" },
              { icon: "solar:users-group-rounded-linear", label: "Guests", value: "2 Adults" },
            ].map((f) => (
              <div key={f.label} className="group flex-1 cursor-text flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition">
                <iconify-icon icon={f.icon} width="22" style={{ color: "#C89B2C" }} />
                <div className="text-left">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{f.label}</div>
                  <div className="text-sm text-brand-900 font-medium">{f.value}</div>
                </div>
              </div>
            ))}
            <button className="bg-royal text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition">
              <iconify-icon icon="solar:magnifer-linear" width="18" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section id="properties" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-gold text-sm uppercase tracking-widest font-medium">Featured</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-light text-brand-900">Premium Properties Across Ghana</h2>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 text-sm font-medium text-brand-900 hover:text-gold transition">
              View all <iconify-icon icon="solar:arrow-right-linear" width="16" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((p) => (
              <div key={p.name} className="group cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-2xl ring-1 ring-brand-900/5 overflow-hidden transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-brand-900 shadow-sm">{p.type}</span>
                  <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm" aria-label="Save">
                    <iconify-icon icon="solar:heart-linear" width="18" style={{ color: "#C89B2C" }} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                    <span className="text-white text-sm font-medium underline decoration-gold underline-offset-4 decoration-2">View Details</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-brand-900">{p.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <iconify-icon icon="solar:map-point-linear" width="14" />
                        {p.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <iconify-icon icon="solar:star-bold" width="14" style={{ color: "#C89B2C" }} />
                      <span className="font-medium">{p.rating}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-brand-900">GHS {p.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">/ night</span>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* CURATED HOTELS */}
      <section id="accommodation" className="py-24 px-6 bg-lavender border-y border-brand-900/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold text-sm uppercase tracking-widest font-medium">Curated</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-light text-brand-900">Hotel Stays for Every Occasion</h2>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">Hand-picked hotel partners with exclusive MOJO member rates.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotels.map((h) => (
              <div key={h.name} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl ring-1 ring-brand-900/5 transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[5/4] overflow-hidden">
                  <img src={h.img} alt={h.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute top-3 left-3 bg-royal text-white text-xs font-medium px-3 py-1 rounded-full">{h.discount}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-medium text-brand-900">{h.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <iconify-icon icon="solar:map-point-linear" width="14" />
                    {h.location}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-brand-900">GHS {h.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-400 line-through underline-offset-4">GHS {h.original.toLocaleString()}</span>
                  </div>
                  <button className="mt-4 w-full py-2.5 rounded-full border border-brand-900/15 text-sm font-medium text-brand-900 hover:bg-royal hover:text-white hover:border-royal transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT DEEP DIVE */}
      <section id="suite" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="text-sm text-gray-500 flex items-center gap-2 mb-6">
            <a href="#" className="hover:text-gold">Home</a>
            <iconify-icon icon="solar:alt-arrow-right-linear" width="12" />
            <a href="#" className="hover:text-gold">Accommodation</a>
            <iconify-icon icon="solar:alt-arrow-right-linear" width="12" />
            <span className="text-brand-900 font-medium">MOJO Luxury Suite</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-light text-brand-900">MOJO Luxury Suite</h2>
              <p className="mt-2 text-gray-600 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1"><iconify-icon icon="solar:map-point-bold" width="16" style={{ color: "#C89B2C" }} /> Cantonments, Accra</span>
                <span className="flex items-center gap-1"><iconify-icon icon="solar:star-bold" width="16" style={{ color: "#C89B2C" }} /> 4.95 (128 reviews)</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-full border border-brand-900/15 text-sm flex items-center gap-2 hover:bg-lavender transition">
                <iconify-icon icon="solar:share-linear" width="16" /> Share
              </button>
              <button className="px-4 py-2 rounded-full border border-brand-900/15 text-sm flex items-center gap-2 hover:bg-lavender transition">
                <iconify-icon icon="solar:heart-linear" width="16" /> Save
              </button>
            </div>
          </div>

          {/* Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 h-auto md:h-[520px] rounded-2xl overflow-hidden">
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            {galleryThumbs.map((t, i) => (
              <div key={i} className="relative overflow-hidden group">
                <img src={t} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {i === 3 && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <button className="px-4 py-2 rounded-full bg-white/95 text-sm font-medium text-brand-900 flex items-center gap-2">
                      <iconify-icon icon="solar:gallery-linear" width="16" />
                      View all 24 photos
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Content grid */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div>
                <h3 className="text-2xl font-light text-brand-900">Hosted by MOJO Concierge</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">A refined two-bedroom retreat in the heart of Cantonments. Floor-to-ceiling windows, locally-curated art, and a private terrace overlooking the embassy gardens. Designed for travelers who expect more than a hotel.</p>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { i: "solar:bed-linear", l: "2 Bedrooms" },
                    { i: "solar:bath-linear", l: "2 Bathrooms" },
                    { i: "solar:users-group-rounded-linear", l: "Up to 4 guests" },
                    { i: "solar:ruler-linear", l: "120 m²" },
                  ].map((x) => (
                    <div key={x.l} className="p-4 rounded-xl bg-white shadow-md ring-1 ring-brand-900/5 hover:shadow-lg hover:-translate-y-0.5 transition">
                      <iconify-icon icon={x.i} width="22" style={{ color: "#C89B2C" }} />
                      <p className="mt-2 text-sm font-medium text-brand-900">{x.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-light text-brand-900 mb-6">Amenities</h3>
                <div className="relative border-l border-brand-900/10">
                  {amenities.map((a, i) => (
                    <div key={a.label} className={`relative pl-6 ${i === amenities.length - 1 ? "" : "pb-5"}`}>
                      <span className={`absolute left-0 -translate-x-1/2 top-1 w-3 h-3 rounded-full ${a.highlight ? "bg-gold" : "border border-brand-900/20 bg-white"}`} />
                      <div className="flex items-center gap-3">
                        <iconify-icon icon={a.icon} width="20" style={{ color: a.highlight ? "#C89B2C" : "#24104D" }} />
                        <span className={`text-sm ${a.highlight ? "font-medium text-brand-900" : "text-gray-700"}`}>{a.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-light text-brand-900 mb-4">Policies</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { i: "solar:login-3-linear", t: "Check-in", d: "From 3:00 PM" },
                    { i: "solar:logout-3-linear", t: "Check-out", d: "Before 11:00 AM" },
                    { i: "solar:smoking-linear", t: "No Smoking", d: "Inside the residence" },
                    { i: "solar:dog-linear", t: "Pet Friendly", d: "Small pets welcome" },
                  ].map((p) => (
                    <div key={p.t} className="p-5 rounded-xl bg-white shadow-md ring-1 ring-brand-900/5 hover:shadow-lg hover:-translate-y-0.5 transition">
                      <iconify-icon icon={p.i} width="22" style={{ color: "#2D1659" }} />
                      <h4 className="mt-2 font-medium text-brand-900">{p.t}</h4>
                      <p className="text-sm text-gray-600">{p.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-light text-brand-900 mb-4">House Rules</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    "Quiet hours observed from 10:00 PM to 7:00 AM",
                    "Maximum 4 overnight guests",
                    "No parties or events without prior approval",
                    "Valid government ID required at check-in",
                  ].map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <iconify-icon icon="solar:check-circle-bold" width="18" style={{ color: "#C89B2C" }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sticky sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 z-10 bg-white border border-brand-900/10 rounded-2xl shadow-lg p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-brand-900">GHS 2,400</span>
                  <span className="text-sm text-gray-400 line-through underline-offset-4">GHS 3,000</span>
                  <span className="text-sm text-gray-500">/ night</span>
                </div>

                <div className="mt-5 grid grid-cols-2 border border-brand-900/10 rounded-xl overflow-hidden">
                  <label className="p-3 border-r border-brand-900/10 cursor-text block">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Check-in</div>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none" />
                  </label>
                  <label className="p-3 cursor-text block">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Check-out</div>
                    <input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none" />
                  </label>
                </div>

                <div className="mt-3 border border-brand-900/10 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Guests</div>
                    <select value={guests} onChange={(e) => setGuests(e.target.value)} className="mt-1 bg-transparent text-sm font-medium focus:outline-none">
                      <option>1 Adult</option>
                      <option>2 Adults</option>
                      <option>3 Adults</option>
                      <option>4 Adults</option>
                    </select>
                  </div>
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="14" />
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between"><span>{ghs(NIGHTLY)} × {nights} {nights === 1 ? "night" : "nights"}</span><span>{ghs(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Cleaning fee</span><span>{ghs(nights > 0 ? CLEANING : 0)}</span></div>
                  <div className="flex justify-between"><span>Service fee</span><span>{ghs(serviceFee)}</span></div>
                  <div className="flex justify-between pt-3 border-t border-brand-900/10 font-semibold text-brand-900 text-base">
                    <span>Total</span><span>{ghs(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setSent(false); setEnquiryOpen(true); }}
                  disabled={nights <= 0}
                  className="mt-5 w-full py-3 rounded-full bg-royal text-white font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40"
                >
                  Book Enquiry
                </button>
                <p className="mt-3 text-xs text-center text-gray-500">You won't be charged yet — enquiry only.</p>

              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-6 bg-lavender scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold text-sm uppercase tracking-widest font-medium">Loved by Guests</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-light text-brand-900">What Our Guests Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white shadow-lg hover:shadow-2xl ring-1 ring-brand-900/5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <iconify-icon key={i} icon="solar:star-bold" width="16" style={{ color: "#C89B2C" }} />
                  ))}
                </div>
                <p className="mt-4 text-gray-700 leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
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

      {/* PRE-FOOTER */}
      <section id="contact" className="py-20 px-6 bg-white scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light text-brand-900">Ready to experience MOJO?</h2>
          <p className="mt-3 text-gray-600">Create an account to unlock member rates and save your favourite stays.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#" className="px-6 py-3 rounded-full bg-royal text-white font-medium hover:opacity-90 transition">Create Account</a>
            <a href="#" className="px-6 py-3 rounded-full border border-brand-900/15 font-medium hover:bg-lavender transition">Sign In</a>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 grayscale opacity-70">
            <iconify-icon icon="logos:visa" width="48" />
            <iconify-icon icon="logos:mastercard" width="48" />
            <iconify-icon icon="logos:amex" width="48" />
            <iconify-icon icon="logos:paypal" width="48" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-brand-900 text-white/80 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="text-2xl font-semibold uppercase tracking-tighter text-gold">MOJO</div>
            <p className="mt-4 text-sm text-white/60 leading-relaxed">Premium apartments and hotels thoughtfully managed across Ghana.</p>
            <div className="mt-5 flex gap-3">
              {["solar:instagram-linear", "solar:facebook-linear", "solar:twitter-linear", "solar:linkedin-linear"].map((i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:bg-gold hover:border-gold transition">
                  <iconify-icon icon={i} width="16" />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: "Accommodation", links: ["Apartments", "Hotels", "Serviced Stays", "Long-term"] },
            { title: "Support", links: ["Help Center", "Contact Us", "Cancellation Policy", "Safety"] },
            { title: "Company", links: ["About", "Careers", "Press", "Partners"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-medium mb-4">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="hover:text-gold transition">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div>© 2026 MOJO Apartments. All rights reserved.</div>
          <div className="flex items-center gap-5">
            <a href="#" className="flex items-center gap-2 hover:text-gold transition">
              <iconify-icon icon="solar:chat-round-dots-linear" width="16" /> WhatsApp
            </a>
            <button className="flex items-center gap-2 hover:text-gold transition">
              <iconify-icon icon="solar:dollar-linear" width="16" /> GHS — Ghana Cedi
            </button>
          </div>
        </div>
      </footer>

      {/* BOOK ENQUIRY MODAL */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEnquiryOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-brand-900/5">
            <div className="flex items-start justify-between p-6 pb-4 border-b border-brand-900/10">
              <div>
                <h3 className="text-lg font-semibold text-brand-900">Book Enquiry</h3>
                <p className="text-sm text-gray-500 mt-1">MOJO Luxury Suite — Cantonments, Accra</p>
              </div>
              <button onClick={() => setEnquiryOpen(false)} aria-label="Close" className="text-gray-400 hover:text-brand-900 transition">
                <iconify-icon icon="solar:close-circle-linear" width="24" />
              </button>
            </div>

            {sent ? (
              <div className="p-8 text-center">
                <iconify-icon icon="solar:check-circle-bold" width="48" style={{ color: "#C89B2C" }} />
                <h4 className="mt-3 text-lg font-semibold text-brand-900">Enquiry sent</h4>
                <p className="mt-2 text-sm text-gray-600">
                  Our team will confirm availability for {fmtDate(checkIn)} — {fmtDate(checkOut)} within 24 hours.
                </p>
                <button onClick={() => setEnquiryOpen(false)} className="mt-6 px-6 py-3 rounded-full bg-royal text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition">
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setSent(true); }}
                className="p-6 space-y-4"
              >
                <div className="grid grid-cols-2 border border-brand-900/10 rounded-xl overflow-hidden">
                  <label className="p-3 border-r border-brand-900/10 cursor-text block">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Check-in</div>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none" />
                  </label>
                  <label className="p-3 cursor-text block">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Check-out</div>
                    <input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none" />
                  </label>
                </div>

                <label className="border border-brand-900/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="w-full">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Guests</div>
                    <select value={guests} onChange={(e) => setGuests(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none">
                      <option>1 Adult</option>
                      <option>2 Adults</option>
                      <option>3 Adults</option>
                      <option>4 Adults</option>
                    </select>
                  </div>
                  <iconify-icon icon="solar:alt-arrow-down-linear" width="14" />
                </label>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input required placeholder="Full name" className="border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                  <input required type="email" placeholder="Email address" className="border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
                <input required placeholder="Phone number" className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                <textarea rows={3} placeholder="Notes for the host (optional)" className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />

                <div className="bg-lavender rounded-xl p-4 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between"><span>{ghs(NIGHTLY)} × {nights} {nights === 1 ? "night" : "nights"}</span><span>{ghs(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Cleaning fee</span><span>{ghs(nights > 0 ? CLEANING : 0)}</span></div>
                  <div className="flex justify-between"><span>Service fee</span><span>{ghs(serviceFee)}</span></div>
                  <div className="flex justify-between"><span>Discount (nightly rate)</span><span className="text-gray-400 line-through underline-offset-4">GHS 3,000 / night</span></div>
                  <div className="flex justify-between pt-3 border-t border-brand-900/10 font-semibold text-brand-900 text-base">
                    <span>Total</span><span>{ghs(total)}</span>
                  </div>
                </div>

                <button type="submit" className="w-full py-3 rounded-full bg-royal text-white font-medium hover:opacity-90 active:scale-[0.98] transition">
                  Send Enquiry
                </button>
                <p className="text-xs text-center text-gray-500">You won't be charged yet — enquiry only.</p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>

  );
}
