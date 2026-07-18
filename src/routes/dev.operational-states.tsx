import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { OPERATIONAL_STATUS_LIST } from "@/domain/operational-status";
import { useI18n } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/dictionaries";
import { isDevToolsEnabled } from "@/config/env";

export const Route = createFileRoute("/dev/operational-states")({
  component: DevOperationalStates,
});

const TITLE_KEY: Record<string, TranslationKey> = {
  product_unavailable: "op_productUnavailable_title",
  price_changed: "op_priceChanged_title",
  payment_pending: "op_paymentPending_title",
  payment_failed: "op_paymentFailed_title",
  payment_cancelled: "op_paymentCancelled_title",
  payment_redirect_return: "op_paymentReturn_title",
  fulfillment_pending: "op_fulfillmentPending_title",
  fulfillment_failed: "op_fulfillmentFailed_title",
  partial_fulfillment: "op_partialFulfillment_title",
  manual_review: "op_manualReview_title",
  refund_requested: "op_refundRequested_title",
  refund_processing: "op_refundProcessing_title",
  refund_completed: "op_refundCompleted_title",
  service_temporarily_unavailable: "op_serviceUnavailable_title",
  offline: "op_offline_title",
  maintenance: "op_maintenance_title",
  update_required: "op_updateRequired_title",
  api_error: "op_apiError_title",
};

/** Development gallery for every Phase 8 operational status screen. */
function DevOperationalStates() {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";

  if (!isDevToolsEnabled()) {
    return <Navigate to="/home" />;
  }

  return (
    <MobileScreen>
      <TopBar title={t("operationalStates")} showBack showCart={false} />
      <ScreenBody>
        <p className="mb-4 text-sm text-muted-foreground">{t("dev_operationalStatesIntro")}</p>
        <div className="space-y-2">
          {OPERATIONAL_STATUS_LIST.map((s) => (
            <Link
              key={s.id}
              to={s.path as never}
              search={
                s.path.includes("order") ||
                s.id.includes("fulfillment") ||
                s.id.includes("refund") ||
                s.id.includes("payment") ||
                s.id === "manual_review" ||
                s.id === "partial_fulfillment"
                  ? ({ orderId: "NTR-SCEN-FULFILL" } as never)
                  : undefined
              }
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div>
                <div className="text-sm font-semibold">{t(TITLE_KEY[s.id])}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{s.path}</div>
              </div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {s.tone}
              </span>
            </Link>
          ))}
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
