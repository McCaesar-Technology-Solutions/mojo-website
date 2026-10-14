import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand/brand-mark";
import { getWhatsAppNumber } from "@/lib/env";

const footerHeading =
  "mb-3 font-[family-name:var(--font-guest-display)] text-[1.125rem] font-normal tracking-[0.02em] text-white";
const footerLink =
  "inline-flex min-h-11 items-center text-[0.875rem] text-white/75 transition hover:text-gold";

export function SiteFooter() {
  const wa = getWhatsAppNumber();

  return (
    <footer className="guest-site bg-brand-900 px-5 pb-8 pt-16 text-white md:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5"
            aria-label="MOJO Apartments home"
          >
            <BrandMark variant="gold" className="!h-9" />
            <span className="font-[family-name:var(--font-guest-display)] text-[1.125rem] font-normal tracking-[0.04em] text-white">
              MOJO
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-[0.875rem] leading-relaxed text-white/75">
            Trusted apartments and hotels managed by MOJO across Ghana. Request to Book — we
            confirm.
          </p>
        </div>
        <div>
          <h2 className={footerHeading}>Stays</h2>
          <div className="mb-4 h-px w-10 bg-gold" aria-hidden />
          <ul className="space-y-0.5">
            <li>
              <Link to="/properties" search={{ type: "Apartment" }} className={footerLink}>
                Apartments
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ type: "Hotel" }} className={footerLink}>
                Hotels
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ type: "Serviced" }} className={footerLink}>
                Serviced Stays
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className={footerHeading}>Support</h2>
          <div className="mb-4 h-px w-10 bg-gold" aria-hidden />
          <ul className="space-y-0.5">
            <li>
              <Link to="/support" className={footerLink}>
                Help Center
              </Link>
            </li>
            <li>
              <Link to="/cancellation" className={footerLink}>
                Cancellation Policy
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={footerLink}>
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={footerLink}>
                Terms
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className={footerHeading}>Company</h2>
          <div className="mb-4 h-px w-10 bg-gold" aria-hidden />
          <ul className="space-y-0.5">
            <li>
              <Link to="/about" className={footerLink}>
                About
              </Link>
            </li>
            <li>
              <Link to="/support" className={footerLink}>
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-[0.8125rem] text-white/70 md:flex-row">
        <div>© {new Date().getFullYear()} MOJO Apartments. All rights reserved.</div>
        <div className="flex items-center gap-5">
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 transition hover:text-gold"
            >
              <iconify-icon icon="solar:chat-round-dots-linear" width="16" /> WhatsApp
            </a>
          ) : (
            <Link
              to="/support"
              className="inline-flex min-h-11 items-center gap-2 transition hover:text-gold"
            >
              <iconify-icon icon="solar:chat-round-dots-linear" width="16" /> Contact
            </Link>
          )}
          <span className="inline-flex min-h-11 items-center gap-2">
            <iconify-icon icon="solar:dollar-linear" width="16" /> GHS — Ghana Cedi
          </span>
        </div>
      </div>
    </footer>
  );
}
