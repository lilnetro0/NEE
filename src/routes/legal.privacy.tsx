import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, H2 } from "@/components/LegalDoc";

export const Route = createFileRoute("/legal/privacy")({ component: () => (
  <LegalDoc title="Privacy Policy">
    <p>We respect your privacy and only collect data required to deliver your codes.</p>
    <H2>Data we collect</H2>
    <p>Email, phone, payment metadata, and device information.</p>
    <H2>How we use it</H2>
    <p>Order fulfillment, fraud prevention, and product improvements.</p>
    <H2>Sharing</H2>
    <p>We share limited data with payment processors and required regulators only.</p>
    <H2>Your rights</H2>
    <p>You can request access, correction, or deletion of your data at privacy@netro.app.</p>
  </LegalDoc>
)});
