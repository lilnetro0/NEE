import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";
import { useOrder } from "@/data-access";

export const Route = createFileRoute("/order/$id/refund")({
  component: function RefundStatusScreen() {
    const { id } = Route.useParams();
    const { data: order } = useOrder(id);

    const statusId =
      order?.refundStatus === "completed" || order?.displayStatus === "refunded"
        ? ("refund_completed" as const)
        : order?.refundStatus === "requested"
          ? ("refund_requested" as const)
          : ("refund_processing" as const);

    return <OperationalStatusScreen statusId={statusId} orderId={id} />;
  },
});
