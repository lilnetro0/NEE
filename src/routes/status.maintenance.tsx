import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/status/maintenance")({
  component: Maintenance,
});

function Maintenance() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      showBack={false}
      tone="warning"
      icon={<Wrench className="h-10 w-10" />}
      title={isAr ? "الصيانة الدورية" : "Under maintenance"}
      message={
        isAr
          ? "نجري تحديثات على المنصة. ستعود الخدمة قريباً."
          : "We're rolling out improvements. Service will resume shortly."
      }
    />
  );
}
