import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

/**
 * Return landing after 3-D Secure / bank redirect.
 * Confirms payment with the processor — does not mean the order is fulfilled.
 */
export const Route = createFileRoute("/status/payment-return")({
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
  }),
  component: function PaymentRedirectReturn() {
    const { orderId } = Route.useSearch();
    return <OperationalStatusScreen statusId="payment_redirect_return" orderId={orderId} />;
  },
});
