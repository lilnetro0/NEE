import type { CurrencyCode } from "@/domain/common";
import type { Region } from "@/domain/regions";
import { useI18n } from "@/i18n/I18nProvider";
import { Globe2 } from "lucide-react";

/**
 * Compact chip showing product region + card currency.
 * The pair is *always* explicit — never conflate the customer's country
 * or display currency with the region a product is redeemable in.
 */
export function RegionBadge({ region, currency }: { region: Region; currency: CurrencyCode }) {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium">
      <Globe2 className="h-3.5 w-3.5" aria-hidden />
      <span>{isAr ? region.name.ar : region.name.en}</span>
      <span className="text-muted-foreground" dir="ltr">
        · {currency}
      </span>
    </span>
  );
}
