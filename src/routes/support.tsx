import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/legal-page";
import { getWhatsAppNumber } from "@/lib/env";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support | MOJO Apartments" }] }),
  component: SupportPage,
});

function SupportPage() {
  const wa = getWhatsAppNumber();
  return (
    <LegalPage title="Help & Support">
      <p>
        Need help choosing a stay or following up on a request? Our team is here for guests across
        Ghana.
      </p>
      <ul>
        <li>
          WhatsApp:{" "}
          {wa ? (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
              Chat with MOJO
            </a>
          ) : (
            <span>Number not configured — email us below.</span>
          )}
        </li>
        <li>
          Email: <a href="mailto:support@mojoapartments.com">support@mojoapartments.com</a>
        </li>
        <li>Response target: within 24 hours for enquiries</li>
      </ul>
      <p>
        Prefer to start a stay request? <Link to="/properties">Browse properties</Link> and Request
        to Book — you are not charged when you submit.
      </p>
    </LegalPage>
  );
}
