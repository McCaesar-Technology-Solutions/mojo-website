import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";

export const Route = createFileRoute("/cancellation")({
  head: () => ({ meta: [{ title: "Cancellation Policy | MOJO Apartments" }] }),
  component: () => (
    <LegalPage title="Cancellation Policy">
      <p>
        <strong>Request to Book:</strong> Enquiries are not charged. Once approved into a confirmed
        booking, cancellations more than 7 days before check-in are free. Within 7 days, one night
        may be retained.
      </p>
      <p>
        <strong>Instant Book:</strong> Full refund if cancelled 7+ days before check-in. 50% refund
        between 7 days and 48 hours. No refund within 48 hours of check-in (except documented
        emergencies reviewed by MOJO).
      </p>
      <p>Date changes are subject to availability and may require a new rate.</p>
    </LegalPage>
  ),
});
