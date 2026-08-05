import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms | MOJO Apartments" }] }),
  component: () => (
    <LegalPage title="Terms of Service">
      <p>
        By using MOJO Apartments you agree to provide accurate guest information, respect house
        rules, and honour payment terms once a booking is confirmed by our team.
      </p>
      <p>
        MOJO may decline or cancel bookings that conflict with availability, safety, or house rules.
        Prices are listed in Ghana Cedis (GHS) unless otherwise stated.
      </p>
    </LegalPage>
  ),
});
