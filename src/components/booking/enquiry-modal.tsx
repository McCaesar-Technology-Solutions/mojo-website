import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enquirySchema, submitEnquiry, type EnquiryFormValues } from "@/lib/enquiries";
import { fmtDate, ghs, whatsappEnquiryLink } from "@/lib/format";
import { getWhatsAppNumber } from "@/lib/env";
import { calcStayTotal, nightsBetween } from "@/lib/format";
import type { Property } from "@/types/domain";
import { useAuth } from "@/contexts/auth-context";

type Props = {
  property: Property;
  open: boolean;
  onClose: () => void;
  checkIn: string;
  checkOut: string;
  guests: number;
  onCheckInChange: (v: string) => void;
  onCheckOutChange: (v: string) => void;
  onGuestsChange: (v: number) => void;
};

export function EnquiryModal({
  property,
  open,
  onClose,
  checkIn,
  checkOut,
  guests,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
}: Props) {
  const { user, profile } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wa = getWhatsAppNumber();

  const nightly = property.pricing?.nightly_rate ?? 0;
  const cleaning = property.pricing?.cleaning_fee ?? 0;
  const rate = property.pricing?.service_fee_rate ?? 0.046875;
  const nights = nightsBetween(checkIn, checkOut);
  const { subtotal, serviceFee, total } = calcStayTotal(nightly, nights, cleaning, rate);

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    values: {
      property_id: property.id,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      full_name: profile?.full_name ?? "",
      email: user?.email ?? "",
      phone: profile?.phone ?? "",
      notes: "",
      website: "",
    },
  });

  if (!open) return null;

  return (
    <div className="guest-site fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-900/55 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-brand-900/10 bg-[#FBFaf7]"
      >
        <div className="flex items-start justify-between border-b border-brand-900/10 px-6 py-5">
          <div>
            <h3
              id="enquiry-title"
              className="font-[family-name:var(--font-guest-display)] text-[1.25rem] font-medium tracking-[-0.02em] text-brand-900"
            >
              Request to Book
            </h3>
            <p className="mt-1 text-[0.875rem] text-brand-900/55">
              {property.title} — {property.area ? `${property.area}, ` : ""}
              {property.city}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-brand-900/50 transition hover:text-brand-900"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" />
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center">
            <iconify-icon icon="solar:check-circle-bold" width="40" className="text-royal" />
            <h4 className="mt-3 text-[1.125rem] font-semibold text-brand-900">Request sent</h4>
            <p className="mt-2 text-[1rem] text-brand-900/60">
              Our team will confirm availability for {fmtDate(checkIn)} — {fmtDate(checkOut)} within
              24 hours.
            </p>
            {wa ? (
              <a
                href={whatsappEnquiryLink(wa, property.title, checkIn, checkOut, guests)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-royal underline decoration-gold/70 underline-offset-4"
              >
                <iconify-icon icon="solar:chat-round-dots-linear" width="16" />
                Follow up on WhatsApp
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="mt-6 block w-full rounded-lg bg-royal px-6 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                await submitEnquiry(values, property);
                setSent(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not send enquiry");
              }
            })}
            className="space-y-4 px-6 py-6"
          >
            <div className="grid grid-cols-2 overflow-hidden border border-brand-900/10 bg-white">
              <label className="block cursor-text border-r border-brand-900/10 p-3">
                <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                  Check-in
                </span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => onCheckInChange(e.target.value)}
                  className="mt-1 w-full bg-transparent text-[0.9375rem] font-medium outline-none"
                />
              </label>
              <label className="block cursor-text p-3">
                <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                  Check-out
                </span>
                <input
                  type="date"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => onCheckOutChange(e.target.value)}
                  className="mt-1 w-full bg-transparent text-[0.9375rem] font-medium outline-none"
                />
              </label>
            </div>

            <label className="block border border-brand-900/10 bg-white p-3">
              <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                Guests
              </span>
              <select
                value={guests}
                onChange={(e) => onGuestsChange(Number(e.target.value))}
                className="mt-1 w-full appearance-none bg-transparent text-[0.9375rem] font-medium outline-none"
              >
                {Array.from({ length: property.max_guests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </label>

            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
              {...form.register("website")}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                  Full name
                </span>
                <input
                  required
                  className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
                  {...form.register("full_name")}
                />
              </label>
              <label className="block">
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                  Email
                </span>
                <input
                  required
                  type="email"
                  className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
                  {...form.register("email")}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                Phone
              </span>
              <input
                required
                className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
                {...form.register("phone")}
              />
            </label>
            <label className="block">
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
                Notes (optional)
              </span>
              <textarea
                rows={3}
                className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
                {...form.register("notes")}
              />
            </label>

            <div className="space-y-2 border border-brand-900/10 bg-lavender/50 px-4 py-4 text-[0.875rem] text-brand-900/70">
              <div className="flex justify-between">
                <span>
                  {ghs(nightly)} × {nights} {nights === 1 ? "night" : "nights"}
                </span>
                <span className="tabular-nums">{ghs(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cleaning fee</span>
                <span className="tabular-nums">{ghs(nights > 0 ? cleaning : 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span className="tabular-nums">{ghs(serviceFee)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-900/10 pt-3 text-[1rem] font-semibold text-brand-900">
                <span>Total</span>
                <span className="tabular-nums">{ghs(total)}</span>
              </div>
            </div>

            {error ? <p className="text-[0.875rem] text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={form.formState.isSubmitting || nights <= 0}
              className="w-full rounded-lg bg-royal py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90 disabled:opacity-40"
            >
              {form.formState.isSubmitting ? "Sending…" : "Send request"}
            </button>
            <p className="text-center text-[0.8125rem] text-brand-900/50">
              You won&apos;t be charged yet — request only.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
