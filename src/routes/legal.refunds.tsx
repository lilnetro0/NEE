import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, H2 } from "@/components/LegalDoc";

export const Route = createFileRoute("/legal/refunds")({
  component: () => (
    <LegalDoc title="Refund Policy">
      <H2>Eligibility</H2>
      <p>Unused codes with proven defect are eligible within 24 hours of purchase.</p>
      <H2>Not eligible</H2>
      <p>Top-ups with wrong Player ID / Server. Codes already revealed and used.</p>
      <H2>Process</H2>
      <p>
        Contact support with your order ID. Refunds go to the original payment method within 3–7
        business days.
      </p>
    </LegalDoc>
  ),
});
