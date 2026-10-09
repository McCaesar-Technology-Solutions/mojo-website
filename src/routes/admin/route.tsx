import {
  Outlet,
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Dashboard", icon: "solar:widget-2-linear", exact: true },
  { to: "/admin/enquiries", label: "Enquiries", icon: "solar:inbox-linear", exact: false },
  { to: "/admin/bookings", label: "Bookings", icon: "solar:calendar-mark-linear", exact: false },
  { to: "/admin/calendar", label: "Calendar", icon: "solar:calendar-linear", exact: false },
  { to: "/admin/properties", label: "Properties", icon: "solar:buildings-2-linear", exact: false },
  {
    to: "/admin/amenities",
    label: "Amenities",
    icon: "solar:checklist-minimalistic-linear",
    exact: false,
  },
  { to: "/admin/guests", label: "Guests", icon: "solar:users-group-rounded-linear", exact: false },
  { to: "/admin/messages", label: "Messages", icon: "solar:chat-round-dots-linear", exact: false },
  { to: "/admin/analytics", label: "Analytics", icon: "solar:chart-linear", exact: false },
  { to: "/admin/reviews", label: "Reviews", icon: "solar:star-linear", exact: false },
  { to: "/admin/audit", label: "Audit", icon: "solar:clipboard-list-linear", exact: false },
] as const;

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const supabase = getSupabase();
    if (!supabase) throw redirect({ to: "/auth/sign-in" });
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/sign-in" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (profile?.role !== "admin") throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      className="ops-console min-h-screen bg-[#F4F2EE] text-brand-900 antialiased"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        aria-hidden
        className="hidden"
        dangerouslySetInnerHTML={{
          __html: `<!--
THESIS: Concierge phone-sheet ops console — enquiry queue beside a request folio; refuses SaaS metric-card dashboards.
OWN-WORLD: Paper stone ground (#F4F2EE), royal primary actions, gold only for NEW urgency, hairline rules, dense rows, system workhorse type on admin.
STORY: Operator opens admin, sees open enquiries, selects one, approves or declines from the folio without losing the queue.
FIRST VIEWPORT: Slim ops rail; status tabs with counts; left queue; right sheet with Approve primary.
FORM: Concierge phone-sheet (seed 07c827b5 · candidate 4); combined comps A+B+C.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
        }}
      />

      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[220px] shrink-0 flex-col border-r border-brand-900/10 bg-[#FBFaf7] transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex h-14 items-center gap-2.5 border-b border-brand-900/10 px-4">
            <Link to="/" className="flex items-center gap-2" aria-label="MOJO Apartments home">
              <BrandMark variant="brand" className="!h-6" />
            </Link>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold tracking-[-0.02em]">MOJO</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-brand-900/45">
                Ops
              </p>
            </div>
            <button
              type="button"
              className="ml-auto rounded-md p-1 text-brand-900/50 md:hidden"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            >
              <iconify-icon icon="solar:close-linear" width="18" />
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Admin">
            {links.map((l) => {
              const active = l.exact
                ? pathname === l.to
                : pathname === l.to || pathname.startsWith(`${l.to}/`);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition",
                    active
                      ? "bg-royal text-white shadow-[0_1px_2px_rgba(45,22,89,0.25)]"
                      : "text-brand-900/70 hover:bg-brand-900/[0.04] hover:text-brand-900",
                    l.to === "/admin/enquiries" && !active && "font-medium text-brand-900",
                  )}
                >
                  <iconify-icon
                    icon={l.icon}
                    width="16"
                    className={active ? "opacity-95" : "opacity-70"}
                  />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-brand-900/10 p-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-brand-900/55 transition hover:bg-brand-900/[0.04] hover:text-brand-900"
            >
              <iconify-icon icon="solar:arrow-left-linear" width="14" />
              View site
            </Link>
          </div>
        </aside>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-brand-900/30 md:hidden"
            aria-label="Dismiss menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-brand-900/10 bg-[#FBFaf7]/90 px-4 backdrop-blur-sm md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                className="rounded-md p-1.5 text-brand-900/70 md:hidden"
                aria-label="Open menu"
                onClick={() => setMobileNavOpen(true)}
              >
                <iconify-icon icon="solar:hamburger-menu-linear" width="20" />
              </button>
              <form
                className="relative hidden min-w-0 max-w-md flex-1 sm:block"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const q = String(fd.get("q") || "").trim();
                  void navigate({
                    to: "/admin/enquiries",
                    search: { q: q || undefined },
                  });
                }}
              >
                <iconify-icon
                  icon="solar:magnifer-linear"
                  width="14"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-900/40"
                />
                <input
                  name="q"
                  placeholder="Search enquiries…"
                  className="w-full rounded-lg border border-brand-900/12 bg-white py-1.5 pl-8 pr-3 text-[13px] text-brand-900 outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
                />
              </form>
              <p className="truncate text-[12px] font-medium text-brand-900 sm:hidden">MOJO Ops</p>
            </div>
            <Link
              to="/admin/enquiries"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-royal px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-royal/90"
            >
              <iconify-icon icon="solar:inbox-linear" width="14" />
              Inbox
            </Link>
          </header>
          <main className="flex-1 px-4 py-5 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
