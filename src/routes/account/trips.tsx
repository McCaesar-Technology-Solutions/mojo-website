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
      <h1 className="text-3xl font-light">My trips</h1>
      <p className="mt-2 text-gray-600">Enquiries and confirmed stays.</p>

      <section className="mt-10">
        <h2 className="text-xl font-medium mb-4">Confirmed bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500">No confirmed bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5">
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium">{b.property?.title ?? "Stay"}</p>
                    <p className="text-sm text-gray-500">
                      {fmtDate(b.check_in)} — {fmtDate(b.check_out)} · {b.guests} guests
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-lavender text-royal">
                      {b.status}
                    </span>
                    <p className="mt-2 font-semibold">{ghs(b.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-medium mb-4">Enquiries</h2>
        {enquiries.length === 0 ? (
          <p className="text-sm text-gray-500">
            No enquiries yet.{" "}
            <Link to="/properties" className="text-gold underline">
              Browse properties
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {enquiries.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl p-5 ring-1 ring-brand-900/5">
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium">{e.property?.title ?? e.property_id}</p>
                    <p className="text-sm text-gray-500">
                      {fmtDate(e.check_in)} — {fmtDate(e.check_out)} · {e.guests} guests
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-lavender text-royal">
                      {e.status}
                    </span>
                    <p className="mt-2 font-semibold">{ghs(e.total)}</p>
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
