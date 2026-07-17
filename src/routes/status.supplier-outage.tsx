import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

/** Customer-safe wording — never exposes supplier names. Path kept for compatibility. */
export const Route = createFileRoute("/status/supplier-outage")({
  component: () => <OperationalStatusScreen statusId="service_temporarily_unavailable" />,
});
