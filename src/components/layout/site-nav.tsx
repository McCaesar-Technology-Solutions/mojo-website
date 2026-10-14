import { Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import menuStill from "@/assets/hero/slide-1.jpg";
import { BrandMark } from "@/components/brand/brand-mark";
import { useAuth } from "@/contexts/auth-context";
import { getWhatsAppNumber } from "@/lib/env";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { to: "/properties" as const, label: "Properties", icon: "solar:home-2-linear" },
  { to: "/about" as const, label: "About", icon: "solar:buildings-2-linear" },
  { to: "/support" as const, label: "Contact", icon: "solar:phone-linear" },
];

const desktopLinks = [
  { to: "/" as const, label: "Home", exact: true },
  { to: "/properties" as const, label: "Properties", exact: false },
  { to: "/about" as const, label: "About", exact: false },
  { to: "/support" as const, label: "Contact", exact: false },
];

const navLinkClass =
  "relative inline-flex min-h-11 items-center py-1 text-[0.9375rem] font-medium text-brand-900 transition hover:text-royal";
const navLinkActiveClass =
  "text-royal after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-gold";

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
            ? "bg-[#F7F5F2]/95 shadow-[0_1px_3px_rgba(36,16,77,0.08)] backdrop-blur-md"
            : "bg-[#F7F5F2]",
        )}
      >
        <div className="relative mx-auto flex h-full max-w-7xl items-center gap-4 px-5 md:px-6">
          <Link
            to="/"
            className="relative z-10 flex min-h-11 shrink-0 items-center gap-2.5"
            aria-label="MOJO Apartments home"
            onClick={close}
          >
            <BrandMark variant="brand" className="!h-8" />
            <span className="font-[family-name:var(--font-guest-display)] text-[1.125rem] font-normal leading-none tracking-[0.04em] text-brand-900">
              MOJO
            </span>
          </Link>

          <div className="absolute inset-x-0 hidden items-center justify-center gap-8 md:flex">
            {desktopLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className={navLinkClass}
                activeProps={{ className: cn(navLinkClass, navLinkActiveClass) }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="relative z-10 ml-auto flex items-center gap-2 sm:gap-3">
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="hidden min-h-11 items-center text-[0.9375rem] font-medium text-brand-900/70 transition hover:text-royal md:inline-flex"
              >
                WhatsApp
              </a>
            ) : null}
            <Link
              to="/account/wishlist"
              className="relative hidden h-11 w-11 items-center justify-center text-brand-900/70 transition hover:text-royal sm:inline-flex"
              aria-label="Wishlist"
            >
              <iconify-icon icon="solar:heart-linear" width="20" />
              {wishlistCount > 0 ? (
                <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-md bg-royal px-1 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>

            {user ? (
              <Link
                to="/account/trips"
                className="hidden min-h-11 items-center text-[0.9375rem] font-medium text-brand-900 transition hover:text-royal md:inline-flex"
              >
                My trips
              </Link>
            ) : (
              <Link
                to="/auth/sign-in"
                className="hidden min-h-11 items-center text-[0.9375rem] font-medium text-brand-900 transition hover:text-royal md:inline-flex"
              >
                Sign in
              </Link>
            )}

            <Link
              to="/properties"
              className="inline-flex min-h-11 items-center rounded-lg bg-royal px-3 text-[0.8125rem] font-medium text-white transition hover:bg-royal/90 sm:px-3.5 sm:text-[0.9375rem]"
            >
              Request to Book
            </Link>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F2] md:hidden"
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
            <img src={menuStill} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-brand-900/55" />
            <div className="relative z-10 flex h-full flex-col justify-between p-3 pt-20 sm:p-4">
              <p className="font-[family-name:var(--font-guest-display)] text-[0.8125rem] font-normal tracking-[0.04em] text-gold sm:text-[0.9375rem]">
                MOJO
              </p>
              <div>
                <p className="font-[family-name:var(--font-guest-display)] text-[0.9375rem] font-normal leading-snug tracking-[0.02em] text-white sm:text-[1.125rem]">
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
              <p className="font-[family-name:var(--font-guest-display)] text-[1.125rem] font-normal tracking-[0.04em] text-gold">
                MOJO
              </p>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
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
                className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#FBFaf7] px-4 py-3.5 text-[0.9375rem] font-medium text-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
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
