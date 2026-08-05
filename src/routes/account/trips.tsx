import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyEnquiries } from "@/lib/enquiries";
import { getSupabase } from "@/lib/supabase/client";
import { fmtDate, ghs } from "@/lib/format";
import type { Booking, Enquiry } from "@/types/domain";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/account/trips")({
  head: () => ({ meta: [{ title: "My Trips | MOJO Apartments" }] }),
  component: TripsPage,
});

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function TripsPage() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    void listMyEnquiries().then(setEnquiries);
    const supabase = getSupabase();
    if (!supabase || !user) return;
    void supabase
      .from("bookings")
      .select("*, property:properties(*)")
      .or(`user_id.eq.${user.id},guest_email.eq.${user.email}`)
      .order("check_in", { ascending: false })
      .then(({ data }) => setBookings((data as Booking[]) ?? []));
  }, [user]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
        My trips
      </h1>
      <div className="mt-3 h-px w-12 bg-gold" aria-hidden />
      <p className="mt-4 text-[1.0625rem] text-brand-900/60">
        Request to Book enquiries and confirmed stays.
      </p>

      <section className="mt-12">
        <h2 className="text-[1.125rem] font-semibold text-brand-900">Confirmed bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-4 text-[1rem] text-brand-900/50">No confirmed bookings yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="border border-brand-900/10 bg-[#FBFaf7] px-5 py-4">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-[1rem] font-medium text-brand-900">
                      {b.property?.title ?? "Stay"}
                    </p>
                    <p className="mt-1 text-[0.875rem] text-brand-900/55">
                      {fmtDate(b.check_in)} — {fmtDate(b.check_out)} · {b.guests} guests
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-md bg-lavender px-2 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-royal">
                      {statusLabel(b.status)}
                    </span>
                    <p className="mt-2 text-[1rem] font-semibold tabular-nums text-brand-900">
                      {ghs(b.total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-[1.125rem] font-semibold text-brand-900">Enquiries</h2>
        {enquiries.length === 0 ? (
          <p className="mt-4 text-[1rem] text-brand-900/50">
            No enquiries yet.{" "}
            <Link
              to="/properties"
              className="font-medium text-royal underline decoration-gold/70 underline-offset-4"
            >
              Browse properties
            </Link>
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {enquiries.map((e) => (
              <div key={e.id} className="border border-brand-900/10 bg-[#FBFaf7] px-5 py-4">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-[1rem] font-medium text-brand-900">
                      {e.property?.title ?? e.property_id}
                    </p>
                    <p className="mt-1 text-[0.875rem] text-brand-900/55">
                      {fmtDate(e.check_in)} — {fmtDate(e.check_out)} · {e.guests} guests
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-md bg-lavender px-2 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-royal">
                      {statusLabel(e.status)}
                    </span>
                    <p className="mt-2 text-[1rem] font-semibold tabular-nums text-brand-900">
                      {ghs(e.total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
