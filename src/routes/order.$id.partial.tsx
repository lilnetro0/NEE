import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/order/$id/partial")({
  component: PartialFulfillment,
});

function PartialFulfillment() {
  const { id } = Route.useParams();
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      tone="warning"
      icon={<AlertTriangle className="h-10 w-10" />}
      title={isAr ? "تسليم جزئي" : "Partial fulfillment"}
      message={
        isAr
          ? "تم تسليم بعض العناصر فقط. سيتم استرداد قيمة العناصر غير المسلَّمة كرصيد."
          : "Some items were fulfilled. Undelivered items will be refunded as store credit."
      }
      primary={{ label: isAr ? "عرض الطلب" : "View order", to: `/order/${id}` }}
      secondary={{ label: isAr ? "الحصول على مساعدة" : "Get help", to: "/support/new" }}
    />
  );
}
