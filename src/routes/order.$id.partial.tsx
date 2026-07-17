import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/order/$id/partial")({
  component: function PartialFulfillment() {
    const { id } = Route.useParams();
    return <OperationalStatusScreen statusId="partial_fulfillment" orderId={id} />;
  },
});
