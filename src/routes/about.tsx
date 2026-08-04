import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About | MOJO Apartments" }] }),
  component: () => (
    <LegalPage title="About MOJO">
      <p>
        MOJO Apartments manages premium apartments and hotel stays across Ghana — Accra, Kumasi,
        Takoradi, Tema, and more. We combine hospitality operations with a modern booking
        experience.
      </p>
      <p>
        Guests can Request to Book (our team confirms availability) or Instant Book on selected
        properties with secure Paystack checkout.
      </p>
    </LegalPage>
  ),
});
