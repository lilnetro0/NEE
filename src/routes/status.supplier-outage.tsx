import { createFileRoute } from "@tanstack/react-router";
import { CloudOff } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/status/supplier-outage")({
  component: SupplierOutage,
});

function SupplierOutage() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      tone="warning"
      icon={<CloudOff className="h-10 w-10" />}
      title={isAr ? "المزوّد غير متاح" : "Supplier temporarily unavailable"}
      message={
        isAr
          ? "الخدمة غير متاحة مؤقتاً من قِبَل المزوّد. حاول لاحقاً."
          : "This service is temporarily unavailable from the supplier. Try again later."
      }
      primary={{ label: isAr ? "الرئيسية" : "Go home", to: "/home" }}
    />
  );
}
