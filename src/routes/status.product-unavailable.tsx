import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/product-unavailable")({
  component: () => <OperationalStatusScreen statusId="product_unavailable" />,
});
