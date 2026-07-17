import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, H2 } from "@/components/LegalDoc";

export const Route = createFileRoute("/legal/about")({
  component: () => (
    <LegalDoc title="About NETRO">
      <p>
        NETRO is a mobile-first digital marketplace for gaming credits, gift cards, and
        subscriptions — built for the Middle East and beyond.
      </p>
      <H2>Our mission</H2>
      <p>Deliver every code instantly, securely, and with the polish gamers deserve.</p>
      <H2>Contact</H2>
      <p>hello@netro.app · Riyadh, Saudi Arabia</p>
    </LegalDoc>
  ),
});
