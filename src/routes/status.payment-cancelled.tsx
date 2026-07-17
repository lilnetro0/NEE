import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/payment-cancelled")({
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
  }),
  component: function PaymentCancelled() {
    const { orderId } = Route.useSearch();
    return <OperationalStatusScreen statusId="payment_cancelled" orderId={orderId} />;
  },
});
