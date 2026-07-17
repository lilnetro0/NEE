import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { MobileScreen, TopBar } from "@/components/shell/Shell";
import { findProduct } from "@/data/catalog";
import { isTopUp } from "@/domain/product";
import type { AccountVerification } from "@/domain/product";
import { validateAll, type FieldValues } from "@/domain/forms";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { productsApi } from "@/api/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id/topup")({
  component: TopUp,
});

function TopUp() {
  const { id } = Route.useParams();
  const domainProduct = findProduct(id);
  const { t, locale, formatPrice } = useI18n();
  const isAr = locale === "ar";
  const { add } = useStore();
  const nav = useNavigate();

  const [pkgId, setPkgId] = useState<string | undefined>(
    domainProduct && isTopUp(domainProduct) ? domainProduct.packages[0]?.id : undefined,
  );
  const [values, setValues] = useState<FieldValues>({});
  const [verification, setVerification] = useState<AccountVerification | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!domainProduct || !isTopUp(domainProduct)) {
    return (
      <MobileScreen>
        <TopBar title="Top-up" showBack />
        <div className="p-6 text-center text-sm text-muted-foreground">
          {isAr
            ? "هذا المنتج لا يدعم الشحن المباشر."
            : "This product doesn't support direct top-up."}
        </div>
      </MobileScreen>
    );
  }

  const pkg = domainProduct.packages.find((p) => p.id === pkgId);
  const price = pkg?.price ?? domainProduct.fromPrice;
  const canProceed =
    validateAll(domainProduct.requiredFields, values).length === 0 &&
    !!pkgId &&
    (!domainProduct.validation.confirmationRequired || confirmed);

  const doVerify = async () => {
    if (domainProduct.validation.accountLookup !== "supported") return;
    setVerifying(true);
    try {
      const v = await productsApi.verifyAccount(domainProduct.id, values);
      setVerification(v);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <MobileScreen className="pb-32">
      <TopBar title={domainProduct.title[locale]} showBack />
      <div className="space-y-5 px-4 pb-8">
        <div className="rounded-3xl border border-warning/30 bg-warning/10 p-4">
          <div className="mb-1 flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <b className="text-sm">{isAr ? "مهم" : "Important"}</b>
          </div>
          <p className="text-xs leading-relaxed text-foreground/80">{t("playerIdWarn")}</p>
        </div>

        <DynamicForm
          schemas={domainProduct.requiredFields}
          value={values}
          onChange={setValues}
          verification={verification}
          onVerify={doVerify}
          verifying={verifying}
          showVerifyButton={domainProduct.validation.accountLookup === "supported"}
        />

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {isAr ? "اختر الباقة" : "Select package"}
          </label>
          <div className="space-y-2">
            {domainProduct.packages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPkgId(p.id)}
                className={
                  "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 " +
                  (pkgId === p.id ? "border-brand bg-brand/10" : "border-input bg-surface")
                }
              >
                <span className="font-semibold">{p.label}</span>
                <span className="text-sm font-bold text-brand">
                  {formatPrice(p.price, domainProduct.displayCurrency)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {domainProduct.validation.confirmationRequired && (
          <label className="flex items-start gap-3 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded"
            />
            <span>
              {isAr
                ? "أؤكد أن البيانات أعلاه صحيحة. لا يمكن استرداد المبلغ عن معرّف خاطئ."
                : "I confirm the details above are correct. Wrong IDs cannot be refunded."}
            </span>
          </label>
        )}

        <div className="flex items-center gap-2 rounded-2xl bg-surface p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-brand" />
          {isAr ? "توصيل آمن وفوري" : "Secure & instant delivery"}
        </div>
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t glass px-4 pt-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">{t("total")}</span>
          <span className="font-display text-xl font-black text-brand">
            {formatPrice(price, domainProduct.displayCurrency)}
          </span>
        </div>
        <button
          disabled={!canProceed}
          onClick={() => {
            if (!pkg) return;
            const err = add({
              key: `${domainProduct.id}-${pkgId}-${values.playerId ?? "x"}`,
              productId: domainProduct.id,
              kind: "direct_topup",
              title: domainProduct.title[locale],
              package: pkg,
              regionCode: domainProduct.region.code,
              regionLabel: domainProduct.region.name[locale],
              displayCurrency: domainProduct.displayCurrency,
              quantity: 1,
              unitPrice: price,
              color: domainProduct.color,
              fulfillmentFields: values,
            });
            if (err) {
              toast.error(
                isAr ? "يُسمح بعملية شحن واحدة فقط لكل طلب في هذا الإصدار." : err.message,
              );
              return;
            }
            toast.success(t("addToCart"));
            nav({ to: "/checkout" });
          }}
          className="h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground shadow-elevated disabled:opacity-40"
        >
          <span className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4" /> {t("proceed")}
          </span>
        </button>
      </div>
    </MobileScreen>
  );
}
