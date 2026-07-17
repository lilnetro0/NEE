import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/price-changed")({
  component: () => <OperationalStatusScreen statusId="price_changed" />,
});
