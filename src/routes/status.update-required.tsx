import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/update-required")({
  component: () => <OperationalStatusScreen statusId="update_required" />,
});
