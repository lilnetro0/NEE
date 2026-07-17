import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/payment-failed")({
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
  }),
  component: function PaymentFailed() {
    const { orderId } = Route.useSearch();
    return <OperationalStatusScreen statusId="payment_failed" orderId={orderId} />;
  },
});
