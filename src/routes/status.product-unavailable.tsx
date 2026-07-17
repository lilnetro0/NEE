import { createFileRoute } from "@tanstack/react-router";
import { PackageX } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/status/product-unavailable")({
  component: ProductUnavailable,
});

function ProductUnavailable() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      tone="warning"
      icon={<PackageX className="h-10 w-10" />}
      title={isAr ? "المنتج غير متاح" : "Product unavailable"}
      message={
        isAr
          ? "هذا المنتج غير متوفر حالياً في منطقتك."
          : "This product is currently unavailable in your region."
      }
      primary={{ label: isAr ? "تصفح" : "Browse products", to: "/home" }}
    />
  );
}
