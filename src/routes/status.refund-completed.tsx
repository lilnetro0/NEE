import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/refund-completed")({
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
  }),
  component: function RefundCompletedStatus() {
    const { orderId } = Route.useSearch();
    return <OperationalStatusScreen statusId="refund_completed" orderId={orderId} />;
  },
});
