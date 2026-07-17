import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/order/$id/failed")({
  component: function OrderFailed() {
    const { id } = Route.useParams();
    return <OperationalStatusScreen statusId="fulfillment_failed" orderId={id} />;
  },
});
