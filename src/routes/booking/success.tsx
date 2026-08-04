import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";

const searchSchema = z.object({
  reference: z.string().optional(),
});

export const Route = createFileRoute("/booking/success")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Booking confirmed | MOJO" }] }),
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  const { reference } = Route.useSearch();
  return (
    <div className="min-h-screen bg-brand-50 text-brand-900">
      <SiteNav />
      <main className="pt-32 pb-20 px-6 text-center max-w-lg mx-auto">
        <iconify-icon icon="solar:check-circle-bold" width="56" style={{ color: "#C89B2C" }} />
        <h1 className="mt-4 text-3xl font-light">Payment received</h1>
        <p className="mt-3 text-gray-600">
          Your Instant Book stay is confirmed
          {reference ? ` (ref ${reference})` : ""}. A receipt will arrive by email shortly.
        </p>
        <Link
          to="/account/trips"
          className="mt-8 inline-flex px-6 py-3 rounded-full bg-royal text-white font-medium"
        >
          View my trips
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
