import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { usePromotions } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { useCapabilities } from "@/platform/useCapabilities";
import { CapabilityDisabledScreen } from "@/platform/CapabilityDisabled";

export const Route = createFileRoute("/account/promotions")({
  component: Promotions,
});

function Promotions() {
  const { t, locale } = useI18n();
  const { data: promos = [] } = usePromotions();
  const { isEnabled } = useCapabilities();

  if (!isEnabled("promotionsEnabled")) {
    return <CapabilityDisabledScreen capability="promotionsEnabled" />;
  }

  return (
    <MobileScreen>
      <TopBar title={t("promotions")} showBack showCart={false} />
      <ScreenBody className="space-y-3">
        {promos.map((p) => (
          <div
            key={p.code}
            className="flex items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-brand-foreground">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{p.title[locale]}</div>
              <div className="text-xs text-muted-foreground">Expires {p.expiresLabel[locale]}</div>
            </div>
            <span className="rounded-full bg-brand px-3 py-1.5 font-mono text-[11px] font-bold text-brand-foreground">
              {p.code}
            </span>
          </div>
        ))}
      </ScreenBody>
    </MobileScreen>
  );
}
