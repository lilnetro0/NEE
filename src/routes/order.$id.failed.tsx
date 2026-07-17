import { createFileRoute } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/order/$id/failed")({
  component: OrderFailed,
});

function OrderFailed() {
  const { id } = Route.useParams();
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      tone="danger"
      icon={<XCircle className="h-10 w-10" />}
      title={isAr ? "فشل التنفيذ" : "Fulfillment failed"}
      message={
        isAr
          ? "لم نتمكن من إتمام طلبك. لن يتم خصم أي مبلغ، وإن تم فسيتم استرداده."
          : "We couldn't complete your order. If you were charged, a refund is on the way."
      }
      primary={{ label: isAr ? "الحصول على مساعدة" : "Get help", to: "/support/new" }}
      secondary={{ label: isAr ? "الطلبات" : "My orders", to: `/order/${id}` }}
    />
  );
}
