import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Zap, AlertTriangle, ShieldCheck, Loader2, Check, XCircle, WifiOff } from "lucide-react";
import { MobileScreen, TopBar } from "@/components/shell/Shell";
import { isTopUp } from "@/domain/product";
import type { AccountValidationState, AccountVerification } from "@/domain/product";
import { validateAll, type FieldValues } from "@/domain/forms";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { useProduct, useVerifyAccount } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { useCapabilities } from "@/platform/useCapabilities";
import { CapabilityDisabledScreen } from "@/platform/CapabilityDisabled";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id/topup")({
  component: TopUp,
});

function TopUp() {
  const { id } = Route.useParams();
  const { data: loaded, status } = useProduct(id);
  const domainProduct = loaded && isTopUp(loaded) ? loaded : undefined;
  const verifyAccount = useVerifyAccount();
  const { t, locale, formatPrice } = useI18n();
  const isAr = locale === "ar";
  const { add } = useStore();
  const nav = useNavigate();
  const { canPurchase, isEnabled } = useCapabilities("direct_topup");

  const [pkgId, setPkgId] = useState<string | undefined>();
  const [values, setValues] = useState<FieldValues>({});
  const [validationState, setValidationState] = useState<AccountValidationState>("idle");
  const [verification, setVerification] = useState<AccountVerification | null>(null);
  const [accountConfirmed, setAccountConfirmed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (domainProduct) setPkgId(domainProduct.packages[0]?.id);
  }, [domainProduct]);

  const fields = domainProduct?.requiredFields ?? [];

  // Reset lookup whenever the account inputs change.
  const fieldSignature = useMemo(
    () =>
      fields
        .filter((f) => f.type !== "info")
        .map((f) => `${f.key}=${values[f.key] ?? ""}`)
        .join("&"),
    [fields, values],
  );
  useEffect(() => {
    setValidationState("idle");
    setVerification(null);
    setAccountConfirmed(false);
  }, [fieldSignature]);

  if (status === "loading") {
    return (
      <MobileScreen>
        <TopBar title="Top-up" showBack />
        <div className="p-6 text-center text-sm text-muted-foreground">{t("loading")}</div>
      </MobileScreen>
    );
  }

  if (!domainProduct) {
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

  if (!canPurchase("direct_topup")) {
    return (
      <CapabilityDisabledScreen
        capability={
          !isEnabled("purchasingEnabled") ? "purchasingEnabled" : "directGameTopUpEnabled"
        }
      />
    );
  }

  const pkg = domainProduct.packages.find((p) => p.id === pkgId);
  const price = pkg?.price ?? domainProduct.fromPrice;
  const lookupSupported = domainProduct.validation.accountLookup === "supported";
  const fieldsValid = validateAll(domainProduct.requiredFields, values).length === 0;

  // When lookup succeeds the user must confirm the previewed account.
  const accountGateSatisfied = !lookupSupported || validationState !== "valid" || accountConfirmed;

  const canProceed =
    fieldsValid &&
    !!pkgId &&
    accountGateSatisfied &&
    (!domainProduct.validation.confirmationRequired || confirmed);

  const runValidation = async () => {
    if (!lookupSupported) return;
    if (!fieldsValid) {
      toast.error(isAr ? "أكمل الحقول المطلوبة أولاً" : "Complete the required fields first");
      return;
    }
    setValidationState("validating");
    setVerification(null);
    setAccountConfirmed(false);
    const result = await verifyAccount(domainProduct.id, values);
    if (!result.ok) {
      setValidationState("unavailable");
      return;
    }
    const data = result.data;
    setVerification(data);
    if (data.ok) {
      setValidationState("valid");
    } else if (data.reason === "temporarily_unavailable") {
      setValidationState("unavailable");
    } else {
      setValidationState("invalid");
    }
  };

  const addToCart = () => {
    if (!pkg) return;
    const err = add({
      key: `${domainProduct.id}-${pkgId}-${values.playerId ?? values.userId ?? "x"}`,
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
      toast.error(isAr ? "يُسمح بعملية شحن واحدة فقط لكل طلب في هذا الإصدار." : err.message);
      return;
    }
    toast.success(t("addToCart"));
    nav({ to: "/checkout" });
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

        <DynamicForm fields={domainProduct.requiredFields} values={values} onChange={setValues} />

        {lookupSupported && (
          <AccountValidation
            state={validationState}
            verification={verification}
            confirmed={accountConfirmed}
            onConfirmChange={setAccountConfirmed}
            onValidate={runValidation}
            isAr={isAr}
          />
        )}

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
          onClick={addToCart}
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

function AccountValidation({
  state,
  verification,
  confirmed,
  onConfirmChange,
  onValidate,
  isAr,
}: {
  state: AccountValidationState;
  verification: AccountVerification | null;
  confirmed: boolean;
  onConfirmChange: (v: boolean) => void;
  onValidate: () => void;
  isAr: boolean;
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onValidate}
        disabled={state === "validating"}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary disabled:opacity-60"
      >
        {state === "validating" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isAr ? "جاري التحقق..." : "Verifying..."}
          </>
        ) : (
          <>{isAr ? "تحقق من الحساب" : "Verify account"}</>
        )}
      </button>

      {state === "valid" && verification?.ok && (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-success">
            <Check className="h-4 w-4" />
            {isAr ? "تم العثور على الحساب" : "Account found"}
          </div>
          {verification.nickname && (
            <p className="mt-2 text-muted-foreground">
              {isAr ? "الاسم: " : "Nickname: "}
              <span dir="ltr" className="font-medium text-foreground">
                {verification.nickname}
              </span>
            </p>
          )}
          {verification.server && (
            <p className="text-muted-foreground">
              {isAr ? "السيرفر: " : "Server: "}
              <span dir="ltr" className="font-medium text-foreground">
                {verification.server}
              </span>
            </p>
          )}
          <label className="mt-3 flex items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => onConfirmChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span>
              {isAr ? "أؤكد أن هذا هو حسابي الصحيح." : "I confirm this is my correct account."}
            </span>
          </label>
        </div>
      )}

      {state === "invalid" && verification && !verification.ok && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{isAr ? verification.message.ar : verification.message.en}</span>
        </div>
      )}

      {state === "unavailable" && (
        <div className="flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground/80">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            {verification && !verification.ok
              ? isAr
                ? verification.message.ar
                : verification.message.en
              : isAr
                ? "تعذّر التحقق من الحساب حالياً. يمكنك المتابعة على مسؤوليتك."
                : "Account lookup failed for now. You can still continue at your discretion."}
          </span>
        </div>
      )}
    </div>
  );
}
