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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-brand-900/5"
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-brand-900/10">
          <div>
            <h3 id="enquiry-title" className="text-lg font-semibold text-brand-900">
              Book Enquiry
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {property.title} — {property.area ? `${property.area}, ` : ""}
              {property.city}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-brand-900 transition"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <iconify-icon icon="solar:check-circle-bold" width="48" style={{ color: "#C89B2C" }} />
            <h4 className="mt-3 text-lg font-semibold text-brand-900">Enquiry sent</h4>
            <p className="mt-2 text-sm text-gray-600">
              Our team will confirm availability for {fmtDate(checkIn)} — {fmtDate(checkOut)} within
              24 hours.
            </p>
            <a
              href={whatsappEnquiryLink(
                getWhatsAppNumber(),
                property.title,
                checkIn,
                checkOut,
                guests,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-royal hover:underline"
            >
              <iconify-icon icon="solar:chat-round-dots-linear" width="16" />
              Follow up on WhatsApp
            </a>
            <button
              onClick={onClose}
              className="mt-6 block w-full px-6 py-3 rounded-full bg-royal text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition"
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
            className="p-6 space-y-4"
          >
            <div className="grid grid-cols-2 border border-brand-900/10 rounded-xl overflow-hidden">
              <label className="p-3 border-r border-brand-900/10 cursor-text block">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                  Check-in
                </div>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => onCheckInChange(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none"
                />
              </label>
              <label className="p-3 cursor-text block">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                  Check-out
                </div>
                <input
                  type="date"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => onCheckOutChange(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none"
                />
              </label>
            </div>

            <label className="border border-brand-900/10 rounded-xl p-3 flex items-center justify-between">
              <div className="w-full">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                  Guests
                </div>
                <select
                  value={guests}
                  onChange={(e) => onGuestsChange(Number(e.target.value))}
                  className="mt-1 w-full bg-transparent text-sm font-medium focus:outline-none"
                >
                  {Array.from({ length: property.max_guests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Adult" : "Adults"}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {/* honeypot */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
              {...form.register("website")}
            />

            <div className="grid sm:grid-cols-2 gap-3">
              <input
                required
                placeholder="Full name"
                className="border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                {...form.register("full_name")}
              />
              <input
                required
                type="email"
                placeholder="Email address"
                className="border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                {...form.register("email")}
              />
            </div>
            <input
              required
              placeholder="Phone number"
              className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              {...form.register("phone")}
            />
            <textarea
              rows={3}
              placeholder="Notes for the host (optional)"
              className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              {...form.register("notes")}
            />

            <div className="bg-lavender rounded-xl p-4 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>
                  {ghs(nightly)} × {nights} {nights === 1 ? "night" : "nights"}
                </span>
                <span>{ghs(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cleaning fee</span>
                <span>{ghs(nights > 0 ? cleaning : 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span>{ghs(serviceFee)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-brand-900/10 font-semibold text-brand-900 text-base">
                <span>Total</span>
                <span>{ghs(total)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={form.formState.isSubmitting || nights <= 0}
              className="w-full py-3 rounded-full bg-royal text-white font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40"
            >
              {form.formState.isSubmitting ? "Sending…" : "Send Enquiry"}
            </button>
            <p className="text-xs text-center text-gray-500">
              You won&apos;t be charged yet — enquiry only.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
