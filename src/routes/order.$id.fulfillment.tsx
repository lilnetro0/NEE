import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";
import { useOrder, useOrderMutations } from "@/data-access";
import type { FulfillmentStatus } from "@/domain/order";

export const Route = createFileRoute("/order/$id/fulfillment")({
  component: FulfillmentPending,
});

/**
 * Order-scoped fulfillment pending. Payment is already confirmed —
 * never frame this as order completion.
 */
function FulfillmentPending() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { pollFulfillment } = useOrderMutations();
  const { data: order } = useOrder(id);
  const [state, setState] = useState<FulfillmentStatus>(order?.fulfillmentStatus ?? "processing");

  useEffect(() => {
    if (order?.fulfillmentStatus) setState(order.fulfillmentStatus);
  }, [order?.fulfillmentStatus]);

  useEffect(() => {
    if (
      state === "fulfilled" ||
      state === "partially_fulfilled" ||
      state === "failed" ||
      state === "manual_review"
    ) {
      return;
    }

    const controller = new AbortController();
    const poll = async () => {
      const r = await pollFulfillment(id, controller.signal);
      if (controller.signal.aborted || !r.ok) return;
      setState(r.data.state);
    };
    void poll();
    const t = setInterval(() => {
      void poll();
    }, 2000);
    return () => {
      controller.abort();
      clearInterval(t);
    };
  }, [id, pollFulfillment, state]);

  useEffect(() => {
    if (state === "fulfilled") {
      void nav({
        to: "/order/$id/success",
        params: { id },
        search: { stage: "delivery" },
      });
    } else if (state === "partially_fulfilled") {
      void nav({ to: "/order/$id/partial", params: { id } });
    } else if (state === "failed") {
      void nav({ to: "/order/$id/failed", params: { id } });
    } else if (state === "manual_review") {
      void nav({
        to: "/status/manual-review",
        search: { orderId: id },
      });
    }
  }, [state, id, nav]);

  if (state === "manual_review") {
    return <OperationalStatusScreen statusId="manual_review" orderId={id} />;
  }

  return <OperationalStatusScreen statusId="fulfillment_pending" orderId={id} />;
}
