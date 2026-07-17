import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/maintenance")({
  component: () => <OperationalStatusScreen statusId="maintenance" />,
});
