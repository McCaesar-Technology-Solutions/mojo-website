import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSupabase } from "@/lib/supabase/client";

const searchSchema = z.object({
  reference: z.string().optional(),
});

export const Route = createFileRoute("/booking/success")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Booking status | MOJO" }] }),
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  const { reference } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "confirmed" | "pending" | "missing">("loading");

  useEffect(() => {
    if (!reference) {
      setStatus("missing");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("missing");
      return;
    }

    let cancelled = false;
    const check = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("status")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (cancelled) return;
      if (!data) setStatus("missing");
      else if (data.status === "confirmed") setStatus("confirmed");
      else setStatus("pending");
    };

    void check();
    const id = window.setInterval(() => void check(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [reference]);

  return (
    <div className="min-h-screen bg-brand-50 text-brand-900">
      <SiteNav />
      <main className="pt-32 pb-20 px-6 text-center max-w-lg mx-auto">
        {status === "loading" && (
          <>
            <iconify-icon icon="solar:refresh-bold" width="48" style={{ color: "#C89B2C" }} />
            <h1 className="mt-4 text-3xl font-light">Confirming payment…</h1>
            <p className="mt-3 text-gray-600">Hang tight while we verify your Paystack payment.</p>
          </>
        )}
        {status === "confirmed" && (
          <>
            <iconify-icon icon="solar:check-circle-bold" width="56" style={{ color: "#C89B2C" }} />
            <h1 className="mt-4 text-3xl font-light">Booking confirmed</h1>
            <p className="mt-3 text-gray-600">
              Payment received{reference ? ` (ref ${reference})` : ""}. A receipt will arrive by email
              shortly.
            </p>
            <Link
              to="/account/trips"
              className="mt-8 inline-flex px-6 py-3 rounded-full bg-royal text-white font-medium"
            >
              View my trips
            </Link>
          </>
        )}
        {status === "pending" && (
          <>
            <iconify-icon icon="solar:hourglass-bold" width="56" style={{ color: "#C89B2C" }} />
            <h1 className="mt-4 text-3xl font-light">Payment received — confirming</h1>
            <p className="mt-3 text-gray-600">
              Paystack reported success; we&apos;re waiting for the final confirmation webhook. This
              usually takes a few seconds. Refresh or check My trips shortly.
            </p>
            <Link
              to="/account/trips"
              className="mt-8 inline-flex px-6 py-3 rounded-full bg-royal text-white font-medium"
            >
              View my trips
            </Link>
          </>
        )}
        {status === "missing" && (
          <>
            <h1 className="text-3xl font-light">Booking not found</h1>
            <p className="mt-3 text-gray-600">
              We couldn&apos;t find that payment reference. If you were charged, contact support with
              your Paystack receipt.
            </p>
            <Link to="/support" className="mt-8 inline-flex px-6 py-3 rounded-full border font-medium">
              Contact support
            </Link>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
