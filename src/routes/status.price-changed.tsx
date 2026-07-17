import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/status/price-changed")({
  component: PriceChanged,
});

function PriceChanged() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <StatusScreen
      tone="warning"
      icon={<TrendingUp className="h-10 w-10" />}
      title={isAr ? "تغيّر السعر" : "Price changed"}
      message={
        isAr
          ? "تغيّر سعر بعض العناصر منذ إضافتها. راجع السلة قبل المتابعة."
          : "The price of some items has changed. Please review your cart before continuing."
      }
      primary={{ label: isAr ? "مراجعة السلة" : "Review cart", to: "/cart" }}
    />
  );
}
