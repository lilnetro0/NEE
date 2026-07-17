import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, H2 } from "@/components/LegalDoc";

export const Route = createFileRoute("/legal/terms")({
  component: () => (
    <LegalDoc title="Terms of Service">
      <p>Last updated: 2026</p>
      <H2>1. Acceptance</H2>
      <p>By using NETRO you agree to these terms. If you do not agree, do not use the service.</p>
      <H2>2. Digital Goods</H2>
      <p>NETRO sells digital codes and top-ups. Once delivered, codes are considered used.</p>
      <H2>3. Accounts</H2>
      <p>Keep your credentials safe. You are responsible for activity on your account.</p>
      <H2>4. Prohibited Use</H2>
      <p>No fraudulent purchases, chargeback abuse, or resale without permission.</p>
      <H2>5. Liability</H2>
      <p>NETRO is provided "as-is". We are not liable for loss caused by third-party platforms.</p>
    </LegalDoc>
  ),
});
