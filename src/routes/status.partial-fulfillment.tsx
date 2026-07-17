import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/partial-fulfillment")({
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
  }),
  component: function PartialFulfillmentStatus() {
    const { orderId } = Route.useSearch();
    return <OperationalStatusScreen statusId="partial_fulfillment" orderId={orderId} />;
  },
});
