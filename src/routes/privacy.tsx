import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy | MOJO Apartments" }] }),
  component: () => (
    <LegalPage title="Privacy Policy">
      <p>
        We collect account details, enquiry/booking information, and payment references (via
        Paystack — we never store card numbers) to operate stays and support.
      </p>
      <p>
        You may request export or deletion of your personal data by emailing
        privacy@mojoapartments.com. We retain booking records as required for accounting and dispute
        resolution.
      </p>
    </LegalPage>
  ),
});
