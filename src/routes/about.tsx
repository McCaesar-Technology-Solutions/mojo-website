import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";
import { getWhatsAppNumber } from "@/lib/env";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About | MOJO Apartments" }] }),
  component: AboutPage,
});

function AboutPage() {
  const wa = getWhatsAppNumber();
  return (
    <LegalPage title="About MOJO">
      <p>
        MOJO Apartments manages a curated selection of apartments and hotels across Ghana — Accra,
        Kumasi, Takoradi, Tema, and more. Specific homes we operate, not a marketplace of every stay.
      </p>
      <p>
        Guests Request to Book. Our team confirms availability — usually within 24 hours — and
        follows up to finalize the stay, including on WhatsApp when you prefer.
      </p>
      <p>
        Browse{" "}
        <Link to="/properties">managed properties</Link>
        {wa ? (
          <>
            , or{" "}
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
              message us on WhatsApp
            </a>
          </>
        ) : (
          <>
            , or{" "}
            <Link to="/support">contact support</Link>
          </>
        )}
        .
      </p>
    </LegalPage>
  );
}
