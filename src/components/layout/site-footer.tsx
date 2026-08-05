import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand/brand-mark";
import { getWhatsAppNumber } from "@/lib/env";

export function SiteFooter() {
  const wa = getWhatsAppNumber();

  return (
    <footer className="bg-brand-900 text-white/80 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="inline-flex items-center" aria-label="MOJO Apartments home">
            <BrandMark variant="gold" className="!h-9" />
          </Link>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            Trusted apartments and hotels managed by MOJO across Ghana. Request to Book — we
            confirm.
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Stays</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/properties"
                search={{ type: "Apartment" }}
                className="hover:text-gold transition"
              >
                Apartments
              </Link>
            </li>
            <li>
              <Link
                to="/properties"
                search={{ type: "Hotel" }}
                className="hover:text-gold transition"
              >
                Hotels
              </Link>
            </li>
            <li>
              <Link
                to="/properties"
                search={{ type: "Serviced" }}
                className="hover:text-gold transition"
              >
                Serviced Stays
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/support" className="hover:text-gold transition">
                Help Center
              </Link>
            </li>
            <li>
              <Link to="/cancellation" className="hover:text-gold transition">
                Cancellation Policy
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-gold transition">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-gold transition">
                Terms
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-gold transition">
                About
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
        <div>© {new Date().getFullYear()} MOJO Apartments. All rights reserved.</div>
        <div className="flex items-center gap-5">
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-gold transition"
            >
              <iconify-icon icon="solar:chat-round-dots-linear" width="16" /> WhatsApp
            </a>
          ) : (
            <Link to="/support" className="flex items-center gap-2 hover:text-gold transition">
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
