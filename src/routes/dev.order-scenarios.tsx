import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { ORDER_SCENARIOS } from "@/data/order-scenarios";
import { localizedOrderStatus } from "@/domain/order";
import { useI18n } from "@/i18n/I18nProvider";
import { isDevToolsEnabled } from "@/config/env";

export const Route = createFileRoute("/dev/order-scenarios")({
  component: DevOrderScenarios,
});

/** Development-only gallery for every significant order lifecycle state. */
function DevOrderScenarios() {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";

  if (!isDevToolsEnabled()) {
    return <Navigate to="/home" />;
  }

  return (
    <MobileScreen>
      <TopBar title={t("orderScenarios")} showBack showCart={false} />
      <ScreenBody>
        <p className="mb-4 text-sm text-muted-foreground">{t("dev_orderScenariosIntro")}</p>
        <div className="space-y-3">
          {ORDER_SCENARIOS.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{s.title[locale]}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{s.key}</div>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase">
                  {localizedOrderStatus(s.order.displayStatus, locale)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.description[locale]}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                <span>pay:{s.order.paymentStatus}</span>
                <span>ful:{s.order.fulfillmentStatus}</span>
                <span>ref:{s.order.refundStatus}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to="/order/$id"
                  params={{ id: s.order.id }}
                  className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
                >
                  {t("details")}
                </Link>
                {s.order.displayStatus === "fulfillment_processing" ||
                s.order.displayStatus === "payment_confirmed" ? (
                  <Link
                    to="/order/$id/fulfillment"
                    params={{ id: s.order.id }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {t("fulfillment")}
                  </Link>
                ) : null}
                {s.order.displayStatus === "fulfilled" ||
                s.order.displayStatus === "payment_confirmed" ? (
                  <Link
                    to="/order/$id/success"
                    params={{ id: s.order.id }}
                    search={{
                      stage: s.order.displayStatus === "fulfilled" ? "delivery" : "payment",
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {t("success")}
                  </Link>
                ) : null}
                {s.order.displayStatus === "partially_fulfilled" ? (
                  <Link
                    to="/order/$id/partial"
                    params={{ id: s.order.id }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {t("partial")}
                  </Link>
                ) : null}
                {s.order.displayStatus === "fulfillment_failed" ? (
                  <Link
                    to="/order/$id/failed"
                    params={{ id: s.order.id }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {t("failed")}
                  </Link>
                ) : null}
                {s.order.displayStatus === "refund_pending" ||
                s.order.displayStatus === "refunded" ? (
                  <Link
                    to="/order/$id/refund"
                    params={{ id: s.order.id }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {t("refund")}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
