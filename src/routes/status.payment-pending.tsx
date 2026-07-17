import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

function orderIdFromSearch(search: Record<string, unknown>): string | undefined {
  return typeof search.orderId === "string" ? search.orderId : undefined;
}

export const Route = createFileRoute("/status/payment-pending")({
  validateSearch: (s: Record<string, unknown>) => ({ orderId: orderIdFromSearch(s) }),
  component: function PaymentPending() {
    const { orderId } = Route.useSearch();
    return <OperationalStatusScreen statusId="payment_pending" orderId={orderId} />;
  },
});
