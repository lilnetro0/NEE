import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";
import { externalUrl } from "@/platform/adapters";

export const Route = createFileRoute("/status/update-required")({
  component: UpdateRequired,
});

function UpdateRequired() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      showBack={false}
      tone="warning"
      icon={<Download className="h-10 w-10" />}
      title={isAr ? "تحديث مطلوب" : "Update required"}
      message={
        isAr
          ? "يرجى تحديث التطبيق إلى أحدث إصدار للمتابعة."
          : "Please update to the latest version to continue."
      }
      primary={{
        label: isAr ? "التحديث" : "Update now",
        onClick: () => externalUrl.open("https://apps.apple.com"),
      }}
    />
  );
}
