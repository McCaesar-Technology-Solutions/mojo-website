import { Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { useAuth } from "@/contexts/auth-context";
import { getWhatsAppNumber } from "@/lib/env";
import { cn } from "@/lib/utils";

const MENU_CINEMA =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80";

const primaryLinks = [
  { to: "/properties" as const, label: "Properties", icon: "solar:home-2-linear" },
  { to: "/about" as const, label: "About", icon: "solar:buildings-2-linear" },
  { to: "/support" as const, label: "Contact", icon: "solar:phone-linear" },
];

export function SiteNav({ wishlistCount = 0 }: { wishlistCount?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const wa = getWhatsAppNumber();
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav
        className={cn(
          "guest-site fixed inset-x-0 top-0 z-50 h-16 transition-[background,box-shadow] duration-300",
          scrolled || open
            ? "bg-[#FBFaf7]/95 shadow-[0_1px_3px_rgba(36,16,77,0.08)] backdrop-blur-md"
            : "bg-[#FBFaf7]/80 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 md:px-6">
          <Link to="/" className="flex items-center" aria-label="MOJO Apartments home" onClick={close}>
            <BrandMark variant="brand" className="!h-8" />
          </Link>

          <div className="hidden items-center gap-7 text-[0.9375rem] font-medium text-brand-900 md:flex">
            <Link to="/properties" className="transition hover:text-royal">
              Properties
            </Link>
            <Link to="/about" className="transition hover:text-royal">
              About
            </Link>
            <Link to="/support" className="transition hover:text-royal">
              Contact
            </Link>
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-royal"
              >
                WhatsApp
              </a>
            ) : null}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/properties"
              className="hidden text-[0.9375rem] text-brand-900/70 transition hover:text-royal sm:inline-flex"
              aria-label="Search properties"
            >
              <iconify-icon icon="solar:magnifer-linear" width="20" />
            </Link>
            <Link
              to="/account/wishlist"
              className="relative hidden text-brand-900/70 transition hover:text-royal sm:inline-flex"
              aria-label="Wishlist"
            >
              <iconify-icon icon="solar:heart-linear" width="20" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-md bg-royal px-1 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>

            {user ? (
              <Link
                to="/account/trips"
                className="hidden text-[0.9375rem] font-medium text-brand-900 transition hover:text-royal md:inline"
              >
                My trips
              </Link>
            ) : (
              <Link
                to="/auth/sign-in"
                className="hidden text-[0.9375rem] font-medium text-brand-900 transition hover:text-royal md:inline"
              >
                Sign in
              </Link>
            )}

            <Link
              to="/properties"
              className="hidden items-center rounded-lg bg-royal px-3.5 py-2 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90 md:inline-flex"
            >
              Request to Book
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-brand-900 md:hidden"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <iconify-icon
                icon={open ? "solar:close-linear" : "solar:hamburger-menu-linear"}
                width="22"
              />
            </button>
          </div>
        </div>
      </nav>

      {open ? (
        <div
          id={menuId}
          className="guest-site fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="relative w-[34%] shrink-0 overflow-hidden sm:w-[38%]">
            <img
              src={MENU_CINEMA}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-900/55" />
            <div className="relative z-10 flex h-full flex-col justify-between p-3 pt-20 sm:p-4">
              <p className="font-[family-name:var(--font-guest-display)] text-[0.8125rem] font-medium tracking-[-0.02em] text-gold sm:text-[0.9375rem]">
                MOJO
              </p>
              <div>
                <p className="font-[family-name:var(--font-guest-display)] text-[0.9375rem] font-medium leading-snug tracking-[-0.02em] text-white sm:text-[1.125rem]">
                  Premium stays. Quiet confidence.
                </p>
                <p className="mt-2 hidden text-[0.8125rem] leading-relaxed text-white/70 min-[420px]:block">
                  Managed apartments across Ghana.
                </p>
                <Link
                  to="/properties"
                  onClick={close}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gold/80 px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-gold"
                >
                  Explore
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="14" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col bg-royal text-gold">
            <div className="absolute inset-x-0 top-0 h-px bg-gold/40" aria-hidden />
            <div className="flex items-center justify-between px-5 pb-2 pt-20">
              <p className="font-[family-name:var(--font-guest-display)] text-[1.125rem] font-medium tracking-[-0.02em] text-gold">
                MOJO
              </p>
              <button
                type="button"
                className="rounded-lg p-2 text-gold"
                aria-label="Close menu"
                onClick={close}
              >
                <iconify-icon icon="solar:close-linear" width="22" />
              </button>
            </div>

            <nav className="mt-4 flex flex-1 flex-col px-5 pb-8">
              {primaryLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={close}
                  className="flex items-center gap-3 border-t border-gold/35 py-4 text-[1.125rem] font-medium uppercase tracking-[0.06em] text-gold"
                >
                  <iconify-icon icon={item.icon} width="18" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="16" aria-hidden />
                </Link>
              ))}
              {wa ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                  className="flex items-center gap-3 border-t border-gold/35 py-4 text-[1.125rem] font-medium uppercase tracking-[0.06em] text-gold"
                >
                  <iconify-icon icon="solar:chat-round-dots-linear" width="18" aria-hidden />
                  <span className="flex-1">WhatsApp</span>
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="16" aria-hidden />
                </a>
              ) : null}

              <Link
                to="/properties"
                onClick={close}
                className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#FBFaf7] px-4 py-3.5 text-[0.9375rem] font-medium text-royal"
              >
                Request to Book
              </Link>

              <div className="mt-auto border-t border-gold/35 pt-4">
                <Link
                  to="/account/wishlist"
                  onClick={close}
                  className="flex items-center gap-3 py-3 text-[0.9375rem] font-medium text-gold/90"
                >
                  <iconify-icon icon="solar:heart-linear" width="18" aria-hidden />
                  Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                </Link>
                {user ? (
                  <>
                    <Link
                      to="/account/trips"
                      onClick={close}
                      className="flex items-center gap-3 py-3 text-[0.9375rem] font-medium text-gold/90"
                    >
                      <iconify-icon icon="solar:suitcase-linear" width="18" aria-hidden />
                      My trips
                    </Link>
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={close}
                        className="flex items-center gap-3 py-3 text-[0.9375rem] font-medium text-gold/90"
                      >
                        <iconify-icon icon="solar:shield-user-linear" width="18" aria-hidden />
                        Admin
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-3 text-left text-[0.9375rem] font-medium text-gold/90"
                      onClick={() => {
                        close();
                        void signOut();
                      }}
                    >
                      <iconify-icon icon="solar:logout-2-linear" width="18" aria-hidden />
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth/sign-in"
                    onClick={close}
                    className="flex items-center gap-3 py-3 text-[0.9375rem] font-medium text-gold/90"
                  >
                    <iconify-icon icon="solar:user-linear" width="18" aria-hidden />
                    Sign in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
