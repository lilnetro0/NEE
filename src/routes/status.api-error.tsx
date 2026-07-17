import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/api-error")({
  component: () => <OperationalStatusScreen statusId="api_error" />,
});
