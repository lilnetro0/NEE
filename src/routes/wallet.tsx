import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Gift, Info, Wallet as WalletIcon } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { CreditProvider, useStoreCredit } from "@/store/CreditProvider";
import { AsyncState } from "@/components/common/AsyncState";
import { Bidi } from "@/components/common/Bidi";
import { useCapabilities } from "@/platform/useCapabilities";
import { CapabilityDisabledScreen } from "@/platform/CapabilityDisabled";
import type { CreditTxn } from "@/domain/order";

export const Route = createFileRoute("/wallet")({
  component: () => (
    <CreditProvider>
      <StoreCreditScreen />
    </CreditProvider>
  ),
});

function StoreCreditScreen() {
  const { t, locale, formatPrice } = useI18n();
  const isAr = locale === "ar";
  const { status, credit, refresh } = useStoreCredit();
  const { isEnabled } = useCapabilities();

  if (!isEnabled("storeCreditEnabled")) {
    return <CapabilityDisabledScreen capability="storeCreditEnabled" />;
  }

  return (
    <MobileScreen>
      <TopBar title={t("storeCredit")} showBack />
      <ScreenBody>
        <AsyncState
          status={status === "ready" && credit ? "ready" : status === "error" ? "error" : "loading"}
          data={credit ?? undefined}
          onRetry={refresh}
        >
          {(c) => (
            <>
              <div className="relative overflow-hidden rounded-3xl gradient-hero p-6 text-white shadow-elevated">
                <div className="pointer-events-none absolute -end-8 -top-6 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
                  <WalletIcon className="h-4 w-4" /> {t("storeCredit")}
                </div>
                <div className="mt-3 font-display text-4xl font-black">
                  <Bidi>{formatPrice(c.balance, c.currency)}</Bidi>
                </div>
                <div className="mt-1 text-xs text-white/70">{t("wallet_availableBalance")}</div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>{t("wallet_creditPolicy")}</p>
              </div>

              {/* walletFundingEnabled is permanently off in local config — no deposit/withdraw CTAs. */}

              <h3 className="mb-2 mt-6 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {t("wallet_transactions")}
              </h3>

              {c.transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("wallet_noTransactions")}
                </p>
              ) : (
                <div className="space-y-2">
                  {c.transactions.map((x) => (
                    <TxnRow key={x.id} txn={x} />
                  ))}
                </div>
              )}
              <div className="pb-6" />
            </>
          )}
        </AsyncState>
      </ScreenBody>
    </MobileScreen>
  );
}

function TxnRow({ txn }: { txn: CreditTxn }) {
  const { locale, formatPrice } = useI18n();
  const isAr = locale === "ar";
  const positive = txn.amount > 0;
  const icon =
    txn.kind === "promo_credit" ? (
      <Gift className="h-4 w-4" />
    ) : positive ? (
      <ArrowDownLeft className="h-4 w-4" />
    ) : (
      <ArrowUpRight className="h-4 w-4" />
    );
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3">
      <div
        className={
          "grid h-10 w-10 place-items-center rounded-xl " +
          (positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")
        }
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-semibold">
          {isAr ? txn.description.ar : txn.description.en}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {new Date(txn.createdAt).toLocaleDateString(isAr ? "ar" : "en")}
        </div>
      </div>
      <span className={"font-bold " + (positive ? "text-success" : "text-foreground")}>
        {positive ? "+" : "−"}
        <Bidi>{formatPrice(Math.abs(txn.amount), txn.currency)}</Bidi>
      </span>
    </div>
  );
}
