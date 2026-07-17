import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/fulfillment-pending")({
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
  }),
  component: function FulfillmentPendingStatus() {
    const { orderId } = Route.useSearch();
    return <OperationalStatusScreen statusId="fulfillment_pending" orderId={orderId} />;
  },
});
