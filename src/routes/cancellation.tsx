import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";

export const Route = createFileRoute("/cancellation")({
  head: () => ({ meta: [{ title: "Cancellation Policy | MOJO Apartments" }] }),
  component: () => (
    <LegalPage title="Cancellation Policy">
      <p>
        <strong>Request to Book:</strong> Enquiries are not charged. Once approved into a confirmed
        booking, cancellations more than 7 days before check-in are free. Within 7 days, one night
        may be retained as a cancellation fee.
      </p>
      <p>Date changes are subject to availability and may require a new rate.</p>
    </LegalPage>
  ),
});
