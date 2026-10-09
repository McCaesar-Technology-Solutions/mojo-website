import { Outlet, createFileRoute, Link, redirect, useRouterState } from "@tanstack/react-router";
import { GuestShell } from "@/components/layout/guest-shell";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

const tabs = [
  { to: "/account/trips" as const, label: "Trips" },
  { to: "/account/wishlist" as const, label: "Wishlist" },
  { to: "/account/messages" as const, label: "Messages" },
];

function AccountLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <GuestShell>
      <div className="mx-auto max-w-5xl">
        <nav
          className="mb-10 flex flex-wrap gap-1 border-b border-brand-900/10"
          aria-label="Account"
        >
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-[0.9375rem] font-medium transition",
                  active
                    ? "border-royal text-royal"
                    : "border-transparent text-brand-900/55 hover:text-brand-900",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <Outlet />
      </div>
    </GuestShell>
  );
}
