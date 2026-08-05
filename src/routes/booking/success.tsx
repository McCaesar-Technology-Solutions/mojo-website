import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { GuestShell } from "@/components/layout/guest-shell";
import { getWhatsAppNumber } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

const searchSchema = z.object({
  reference: z.string().optional(),
});

export const Route = createFileRoute("/booking/success")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Booking status | MOJO Apartments" }] }),
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  const { reference } = Route.useSearch();
  const wa = getWhatsAppNumber();
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
    <GuestShell mainClassName="pt-28">
      <div className="mx-auto max-w-lg text-center">
        {status === "loading" && reference ? (
          <>
            <iconify-icon icon="solar:refresh-bold" width="40" className="text-royal" />
            <h1 className="mt-4 font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
              Confirming booking…
            </h1>
            <p className="mt-3 text-[1.0625rem] text-brand-900/60">
              Checking your booking reference. This usually takes a few seconds.
            </p>
          </>
        ) : null}

        {status === "confirmed" ? (
          <>
            <iconify-icon icon="solar:check-circle-bold" width="48" className="text-royal" />
            <h1 className="mt-4 font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
              Booking confirmed
            </h1>
            <p className="mt-3 text-[1.0625rem] text-brand-900/60">
              Your stay is confirmed
              {reference ? ` (ref ${reference})` : ""}. A confirmation email will follow shortly.
            </p>
            <Link
              to="/account/trips"
              className="mt-8 inline-flex rounded-lg bg-royal px-5 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
            >
              View my trips
            </Link>
          </>
        ) : null}

        {status === "pending" ? (
          <>
            <iconify-icon icon="solar:hourglass-bold" width="48" className="text-royal" />
            <h1 className="mt-4 font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
              Almost there
            </h1>
            <p className="mt-3 text-[1.0625rem] text-brand-900/60">
              We have your reference and are waiting on final confirmation. Check My trips in a
              moment, or contact us if nothing appears.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/account/trips"
                className="inline-flex rounded-lg bg-royal px-5 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
              >
                View my trips
              </Link>
              <Link
                to="/support"
                className="inline-flex rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60"
              >
                Contact support
              </Link>
            </div>
          </>
        ) : null}

        {status === "missing" ? (
          <>
            <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
              Looking for your stay?
            </h1>
            <div className="mx-auto mt-3 h-px w-12 bg-gold" aria-hidden />
            <p className="mt-4 text-[1.0625rem] text-brand-900/60">
              {reference
                ? "We couldn’t find that booking reference. If you expected a confirmation, contact support with any receipt details you have."
                : "MOJO launches with Request to Book — submit a stay request on a property page. Instant online payment is not live yet. Track enquiries in My trips after you sign in."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/properties"
                className="inline-flex rounded-lg bg-royal px-5 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
              >
                Browse stays
              </Link>
              <Link
                to="/account/trips"
                className="inline-flex rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60"
              >
                My trips
              </Link>
              {wa ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60"
                >
                  <iconify-icon icon="solar:chat-round-dots-linear" width="16" />
                  WhatsApp
                </a>
              ) : (
                <Link
                  to="/support"
                  className="inline-flex rounded-lg border border-brand-900/15 bg-white px-5 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60"
                >
                  Contact support
                </Link>
              )}
            </div>
          </>
        ) : null}
      </div>
    </GuestShell>
  );
}
