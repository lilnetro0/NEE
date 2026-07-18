import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck, CreditCard } from "lucide-react";
import { MobileScreen } from "@/components/shell/Shell";
import { useOrder } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/order/$id/success")({
  validateSearch: (search: Record<string, unknown>): { stage?: "payment" | "delivery" } => ({
    stage: search.stage === "payment" || search.stage === "delivery" ? search.stage : undefined,
  }),
  component: Success,
});

/**
 * Order success route — always distinguishes payment confirmation from delivery.
 * Payment success must never present as “order completed.”
 */
function Success() {
  const { id } = Route.useParams();
  const { stage } = Route.useSearch();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const { data: order } = useOrder(id);

  const display = order?.displayStatus;
  const deliveryConfirmed =
    stage === "delivery" ||
    display === "fulfilled" ||
    (stage !== "payment" && display === "partially_fulfilled");
  const paymentOnly = !deliveryConfirmed;

  const title = deliveryConfirmed ? t("deliveryConfirmed") : t("paymentConfirmed");
  const message = deliveryConfirmed ? t("orderSuccess_readyBody") : t("orderSuccess_paidBody");

  const Icon = deliveryConfirmed ? PackageCheck : CreditCard;

  return (
    <MobileScreen>
      <div className="pt-safe flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-brand/30 blur-3xl" />
          <div className="grid h-24 w-24 place-items-center rounded-full gradient-brand shadow-elevated">
            {paymentOnly && !deliveryConfirmed ? (
              <Icon className="h-12 w-12 text-brand-foreground" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 className="h-12 w-12 text-brand-foreground" strokeWidth={2.5} />
            )}
          </div>
        </div>
        <h1 className="mt-8 font-display text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 rounded-2xl bg-surface px-6 py-3 text-sm">
          <span className="text-muted-foreground">{t("orderNo")}: </span>
          <span className="font-mono font-bold">{id}</span>
        </div>
        {!deliveryConfirmed && (
          <p className="mt-3 max-w-xs text-xs text-muted-foreground">
            {t("orderSuccess_notifyNote")}
          </p>
        )}
        <div className="pb-safe mt-12 flex w-full flex-col gap-3">
          {!deliveryConfirmed && (
            <Link
              to="/order/$id/fulfillment"
              params={{ id }}
              className="h-14 rounded-full gradient-brand text-sm font-bold leading-[3.5rem] text-brand-foreground shadow-elevated"
            >
              {t("trackFulfillment")}
            </Link>
          )}
          <Link
            to="/order/$id"
            params={{ id }}
            className={
              deliveryConfirmed
                ? "h-14 rounded-full gradient-brand text-sm font-bold leading-[3.5rem] text-brand-foreground shadow-elevated"
                : "h-14 rounded-full border border-input text-sm font-bold leading-[3.5rem] text-foreground"
            }
          >
            {t("viewOrder")}
          </Link>
          <Link
            to="/support/new"
            search={{ orderId: id, itemId: undefined }}
            className="h-14 rounded-full border border-input text-sm font-bold leading-[3.5rem] text-foreground"
          >
            {t("contactSupport")}
          </Link>
          <Link
            to="/home"
            className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </MobileScreen>
  );
}
