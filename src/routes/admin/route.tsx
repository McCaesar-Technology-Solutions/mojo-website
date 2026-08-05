import { Outlet, createFileRoute, Link, redirect } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand/brand-mark";
import { getSupabase } from "@/lib/supabase/client";

const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/properties", label: "Properties" },
  { to: "/admin/enquiries", label: "Enquiries" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/calendar", label: "Calendar" },
  { to: "/admin/guests", label: "Guests" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/audit", label: "Audit" },
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
  return (
    <div className="min-h-screen bg-[#f7f5fb] text-brand-900">
      <header className="border-b border-brand-900/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2" aria-label="MOJO Apartments home">
              <BrandMark variant="brand" className="!h-7" />
            </Link>
            <span className="text-sm text-gray-500">Admin</span>
          </div>
          <Link to="/" className="text-sm hover:text-gold">
            View site
          </Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block px-3 py-2 rounded-lg text-sm hover:bg-white [&.active]:bg-white [&.active]:font-medium [&.active]:text-royal"
              activeOptions={{ exact: "exact" in l ? l.exact : false }}
            >
              {l.label}
            </Link>
          ))}
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
