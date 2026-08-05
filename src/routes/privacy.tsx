import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy | MOJO Apartments" }] }),
  component: () => (
    <LegalPage title="Privacy Policy">
      <p>
        We collect account details and enquiry/booking information to operate stays and support.
        When online payments are enabled, payment references are processed by our payment partner —
        we never store card numbers.
      </p>
      <p>
        You may request export or deletion of your personal data by emailing
        privacy@mojoapartments.com. We retain booking records as required for accounting and dispute
        resolution.
      </p>
    </LegalPage>
  ),
});
