import { createFileRoute } from "@tanstack/react-router";
import { Undo2 } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/order/$id/refund")({
  component: RefundStatus,
});

function RefundStatus() {
  const { id } = Route.useParams();
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      tone="neutral"
      icon={<Undo2 className="h-10 w-10" />}
      title={isAr ? "الاسترداد قيد المعالجة" : "Refund in progress"}
      message={
        isAr
          ? "قد يستغرق الاسترداد من 3 إلى 7 أيام عمل حسب طريقة الدفع."
          : "Refunds typically take 3–7 business days depending on your payment method."
      }
      primary={{ label: isAr ? "عرض الطلب" : "View order", to: `/order/${id}` }}
    />
  );
}
