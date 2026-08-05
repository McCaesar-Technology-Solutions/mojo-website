import { Outlet, createFileRoute, Link, redirect } from "@tanstack/react-router";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/account")({
  beforeLoad: async ({ location }) => {
    const supabase = getSupabase();
    if (!supabase) throw redirect({ to: "/auth/sign-in" });
    const { data } = await supabase.auth.getSession();
    if (!data.session && !location.pathname.includes("wishlist")) {
      throw redirect({ to: "/auth/sign-in" });
    }
  },
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <div className="min-h-screen bg-brand-50 text-brand-900">
      <SiteNav />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-4 mb-8 text-sm font-medium">
            <Link to="/account/trips" className="hover:text-gold [&.active]:text-gold">
              Trips
            </Link>
            <Link to="/account/wishlist" className="hover:text-gold">
              Wishlist
            </Link>
            <Link to="/account/messages" className="hover:text-gold">
              Messages
            </Link>
          </div>
          <Outlet />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
