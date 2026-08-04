import { createFileRoute } from "@tanstack/react-router";
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
      <p>Need help with an enquiry or stay? Our concierge team is available daily.</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          WhatsApp:{" "}
          <a className="text-royal underline" href={`https://wa.me/${wa}`}>
            Chat with MOJO
          </a>
        </li>
        <li>Email: support@mojoapartments.com</li>
        <li>Response target: within 24 hours for enquiries</li>
      </ul>
    </LegalPage>
  );
}
