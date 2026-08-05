import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export function SiteNav({ wishlistCount = 0 }: { wishlistCount?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 h-16 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "bg-white/90 shadow-sm" : "bg-white/80"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold uppercase tracking-tighter text-gold">
          MOJO
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <div className="relative group">
            <Link
              to="/properties"
              search={{ type: "Hotel" }}
              className="flex items-center gap-1 text-brand-900 hover:text-gold transition"
            >
              Accommodation
              <iconify-icon icon="solar:alt-arrow-down-linear" width="14" />
            </Link>
            <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                <Link
                  key={c}
                  to="/properties"
                  search={{ city: c }}
                  className="block px-3 py-2 text-sm hover:bg-lavender rounded-lg"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative group">
            <Link
              to="/properties"
              className="flex items-center gap-1 text-brand-900 hover:text-gold transition"
            >
              Properties
              <iconify-icon icon="solar:alt-arrow-down-linear" width="14" />
            </Link>
            <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {["Accra", "Kumasi", "Takoradi", "Tema"].map((c) => (
                <Link
                  key={c}
                  to="/properties"
                  search={{ city: c }}
                  className="block px-3 py-2 text-sm hover:bg-lavender rounded-lg"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/about" className="text-brand-900 hover:text-gold transition">
            About
          </Link>
          <Link to="/support" className="text-brand-900 hover:text-gold transition">
            Contact
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/properties"
            className="text-brand-900 hover:text-gold transition"
            aria-label="Search"
          >
            <iconify-icon icon="solar:magnifer-linear" width="20" />
          </Link>
          <span className="hidden md:block h-5 w-px bg-gray-300" />
          {user ? (
            <>
              <Link
                to="/account/trips"
                className="hidden md:block text-sm font-medium hover:text-gold transition"
              >
                My trips
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:block text-sm font-medium hover:text-gold transition"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => void signOut()}
                className="hidden md:block text-sm font-medium hover:text-gold transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth/sign-in"
              className="hidden md:block text-sm font-medium hover:text-gold transition"
            >
              Sign In
            </Link>
          )}
          <Link
            to="/properties"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-full bg-royal text-white text-sm font-medium hover:opacity-90 transition"
          >
            Book Now
          </Link>
          <Link to="/account/wishlist" className="relative" aria-label="Wishlist">
            <iconify-icon icon="solar:heart-linear" width="22" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
