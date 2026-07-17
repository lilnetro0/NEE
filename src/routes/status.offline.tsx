import { createFileRoute } from "@tanstack/react-router";
import { OperationalStatusScreen } from "@/components/common/OperationalStatusScreen";

export const Route = createFileRoute("/status/offline")({
  component: () => <OperationalStatusScreen statusId="offline" />,
});
