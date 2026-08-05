import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand/brand-mark";
import { getWhatsAppNumber } from "@/lib/env";

export function SiteFooter() {
  const wa = getWhatsAppNumber();

  return (
    <footer className="guest-site bg-brand-900 px-5 pb-8 pt-16 text-white/80 md:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="inline-flex items-center" aria-label="MOJO Apartments home">
            <BrandMark variant="gold" className="!h-9" />
          </Link>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-white/60">
            Trusted apartments and hotels managed by MOJO across Ghana. Request to Book — we
            confirm.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-[0.9375rem] font-medium text-white">Stays</h4>
          <ul className="space-y-2 text-[0.875rem]">
            <li>
              <Link
                to="/properties"
                search={{ type: "Apartment" }}
                className="transition hover:text-gold"
              >
                Apartments
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ type: "Hotel" }} className="transition hover:text-gold">
                Hotels
              </Link>
            </li>
            <li>
              <Link
                to="/properties"
                search={{ type: "Serviced" }}
                className="transition hover:text-gold"
              >
                Serviced Stays
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-[0.9375rem] font-medium text-white">Support</h4>
          <ul className="space-y-2 text-[0.875rem]">
            <li>
              <Link to="/support" className="transition hover:text-gold">
                Help Center
              </Link>
            </li>
            <li>
              <Link to="/cancellation" className="transition hover:text-gold">
                Cancellation Policy
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition hover:text-gold">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="transition hover:text-gold">
                Terms
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-[0.9375rem] font-medium text-white">Company</h4>
          <ul className="space-y-2 text-[0.875rem]">
            <li>
              <Link to="/about" className="transition hover:text-gold">
                About
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-[0.8125rem] text-white/50 md:flex-row">
        <div>© {new Date().getFullYear()} MOJO Apartments. All rights reserved.</div>
        <div className="flex items-center gap-5">
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition hover:text-gold"
            >
              <iconify-icon icon="solar:chat-round-dots-linear" width="16" /> WhatsApp
            </a>
          ) : (
            <Link to="/support" className="flex items-center gap-2 transition hover:text-gold">
              <iconify-icon icon="solar:chat-round-dots-linear" width="16" /> Contact
            </Link>
          )}
          <span className="flex items-center gap-2">
            <iconify-icon icon="solar:dollar-linear" width="16" /> GHS — Ghana Cedi
          </span>
        </div>
      </div>
    </footer>
  );
}
