import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Smartphone,
  CreditCard,
  Apple,
  Wallet,
  Check,
  Landmark,
  RefreshCw,
  Clock,
  AlertTriangle,
  Globe2,
  Loader2,
  PackageX,
  TrendingUp,
  Ticket,
} from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOrderMutations } from "@/data-access";
import type { CheckoutQuote, CheckoutState, QuoteAvailabilityStatus } from "@/domain/order";
import { useCapabilities } from "@/platform/useCapabilities";
import { CapabilityDisabledPanel, CapabilityDisabledScreen } from "@/platform/CapabilityDisabled";
import { Bidi } from "@/components/common/Bidi";
import { DEFAULT_MARKET_COUNTRY } from "@/platform/capabilities";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

type Method = "mada" | "visa" | "applepay" | "stcpay" | "credit";

type QuoteUiStatus =
  "idle" | "loading" | "ready" | "expired" | "price_changed" | "product_unavailable" | "error";

/**
 * Checkout is quote-driven:
 *   validating_order → awaiting_payment → payment_processing
 *         → payment_confirmed → (navigate fulfillment; never “order completed”)
 *
 * The payable total always comes from CheckoutQuote — never from cart math.
 * Payment requires a fresh, non-expired, available quote. No real payment runs.
 */
function Checkout() {
  const { t, locale, formatPrice } = useI18n();
  const isAr = locale === "ar";
  const { items, clear } = useStore();
  const nav = useNavigate();
  const { createQuote, refreshQuote: refreshQuoteRepo, create } = useOrderMutations();
  const { capabilities, paymentRails, isEnabled } = useCapabilities();

  const [email, setEmail] = useState("ahmad@example.com");
  const [phone, setPhone] = useState("+9665");
  const [method, setMethod] = useState<Method>("mada");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>();

  const [state, setState] = useState<CheckoutState>("validating_order");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteUi, setQuoteUi] = useState<QuoteUiStatus>("idle");
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const methods: {
    id: Method;
    label: string;
    icon: typeof CreditCard;
    sub?: string;
    enabled: boolean;
  }[] = [
    {
      id: "mada",
      label: "Mada",
      icon: CreditCard,
      sub: "•• 4421",
      enabled: paymentRails.madaEnabled,
    },
    {
      id: "visa",
      label: "Visa / Mastercard",
      icon: CreditCard,
      enabled: paymentRails.visaEnabled,
    },
    {
      id: "applepay",
      label: "Apple Pay",
      icon: Apple,
      enabled: paymentRails.applePayEnabled,
    },
    {
      id: "stcpay",
      label: "STC Pay",
      icon: Smartphone,
      enabled: paymentRails.stcPayEnabled,
    },
    {
      id: "credit",
      label: isAr ? "رصيد متجر NETRO" : "NETRO Store Credit",
      icon: Wallet,
      sub: formatPrice(42.5, "SAR"),
      enabled: capabilities.storeCreditEnabled,
    },
  ];

  const enabledMethods = methods.filter((m) => m.enabled);
  const enabledMethodKey = enabledMethods.map((m) => m.id).join(",");

  useEffect(() => {
    if (enabledMethods.length === 0) return;
    if (!enabledMethods.some((m) => m.id === method)) {
      setMethod(enabledMethods[0].id);
    }
  }, [enabledMethodKey, enabledMethods, method]);

  const mapAvailabilityToUi = (status: QuoteAvailabilityStatus): QuoteUiStatus => {
    if (status === "expired") return "expired";
    if (status === "price_changed") return "price_changed";
    if (status === "product_unavailable") return "product_unavailable";
    return "ready";
  };

  const requestQuote = useCallback(
    async (promoCode?: string, simulate?: "price_changed" | "product_unavailable") => {
      if (!isEnabled("purchasingEnabled")) return;
      if (items.length === 0) {
        setQuote(null);
        setQuoteUi("idle");
        setState("validating_order");
        return;
      }

      setQuoteUi("loading");
      setQuoteError(null);
      setState("validating_order");

      const result = await createQuote({
        items: items.map((i) => ({
          productId: i.productId,
          sku: i.kind === "gift_card" ? i.denomination.id : i.package.id,
          quantity: i.quantity,
          clientUnitPrice: i.unitPrice,
          fulfillmentFields: i.kind === "direct_topup" ? i.fulfillmentFields : undefined,
        })),
        country: DEFAULT_MARKET_COUNTRY,
        displayCurrency: items[0]?.displayCurrency ?? "SAR",
        paymentCurrency: items[0]?.displayCurrency ?? "SAR",
        promoCode,
        simulate,
      });

      if (!result.ok) {
        setQuote(null);
        setQuoteUi("error");
        setQuoteError(result.error.message);
        setState("validating_order");
        return;
      }

      setQuote(result.data);
      setAppliedPromo(result.data.promoCode);
      setQuoteUi(mapAvailabilityToUi(result.data.availabilityStatus));
      setState(
        result.data.availabilityStatus === "available" ? "awaiting_payment" : "validating_order",
      );
    },
    [createQuote, isEnabled, items],
  );

  // Request a quote whenever the cart changes — totals never come from cart math.
  useEffect(() => {
    const controller = new AbortController();
    void requestQuote(appliedPromo);
    return () => controller.abort();
    // Intentionally exclude appliedPromo to avoid loops; promo apply calls requestQuote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, requestQuote]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Flip UI to expired when the clock crosses expiresAt.
  useEffect(() => {
    if (!quote) return;
    if (new Date(quote.expiresAt).getTime() <= now && quoteUi !== "loading") {
      setQuoteUi("expired");
      setQuote((prev) => (prev ? { ...prev, availabilityStatus: "expired" } : prev));
    }
  }, [now, quote, quoteUi]);

  if (!isEnabled("purchasingEnabled")) {
    return <CapabilityDisabledScreen capability="purchasingEnabled" />;
  }

  if (items.length === 0 && quoteUi !== "loading") {
    return (
      <MobileScreen>
        <TopBar title={t("reviewOrder")} showBack showCart={false} />
        <ScreenBody className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            {isAr ? "سلتك فارغة" : "Your cart is empty"}
          </p>
          <Link
            to="/home"
            className="mt-6 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-bold text-brand-foreground"
          >
            {t("browseNow")}
          </Link>
        </ScreenBody>
      </MobileScreen>
    );
  }

  const secondsLeft = quote
    ? Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - now) / 1000))
    : 0;
  const expired = quoteUi === "expired" || secondsLeft === 0;
  const quotePayable =
    !!quote && quoteUi === "ready" && quote.availabilityStatus === "available" && !expired;

  const refreshQuote = async (simulate?: "price_changed" | "product_unavailable") => {
    if (!quote) {
      await requestQuote(appliedPromo, simulate);
      return;
    }
    setQuoteUi("loading");
    setState("validating_order");
    const result = await refreshQuoteRepo(quote.id, { simulate });
    if (!result.ok) {
      // Fall back to a brand-new quote if the previous id was discarded.
      await requestQuote(appliedPromo, simulate);
      return;
    }
    setQuote(result.data);
    setAppliedPromo(result.data.promoCode);
    setQuoteUi(mapAvailabilityToUi(result.data.availabilityStatus));
    setState(
      result.data.availabilityStatus === "available" ? "awaiting_payment" : "validating_order",
    );
    toast.success(isAr ? "تم تحديث العرض" : "Quote refreshed");
  };

  /** Accept catalog prices after a price-change warning by re-quoting without client drift. */
  const acceptNewPrices = async () => {
    if (!quote) return;
    setQuoteUi("loading");
    setState("validating_order");
    const result = await createQuote({
      items: quote.items.map((line) => ({
        productId: line.productId,
        sku: line.sku,
        quantity: line.quantity,
        clientUnitPrice: line.unitPrice,
      })),
      country: quote.country,
      displayCurrency: quote.displayCurrency,
      paymentCurrency: quote.paymentCurrency,
      promoCode: appliedPromo,
    });
    if (!result.ok) {
      setQuoteUi("error");
      setQuoteError(result.error.message);
      setState("validating_order");
      return;
    }
    setQuote(result.data);
    setQuoteUi(mapAvailabilityToUi(result.data.availabilityStatus));
    setState(
      result.data.availabilityStatus === "available" ? "awaiting_payment" : "validating_order",
    );
  };

  const applyPromo = async () => {
    const code = promoInput.trim() || undefined;
    await requestQuote(code);
  };

  const submit = async () => {
    if (!quotePayable || !quote || enabledMethods.length === 0) {
      if (expired) {
        toast.error(isAr ? "انتهت صلاحية العرض — حدّث أولاً" : "Quote expired — refresh first");
      }
      return;
    }
    setState("payment_processing");
    try {
      // Mock authorization only — no real payment provider is contacted.
      await new Promise((r) => setTimeout(r, 700));
      setState("payment_confirmed");
      await new Promise((r) => setTimeout(r, 300));

      const created = await create({ quoteId: quote.id, paymentMethod: method });
      if (!created.ok) {
        if (created.error.code === "conflict" || created.error.message.includes("expired")) {
          setQuoteUi("expired");
          toast.error(isAr ? "انتهت صلاحية العرض" : "Quote expired");
          setState("awaiting_payment");
          return;
        }
        if (created.error.code === "unavailable") {
          setQuoteUi("product_unavailable");
          setState("validating_order");
          return;
        }
        throw new Error(created.error.message);
      }
      setState("payment_confirmed");
      clear();
      nav({ to: "/order/$id/fulfillment", params: { id: created.data.id } });
    } catch (e) {
      console.error(e);
      setState("awaiting_payment");
      toast.error(isAr ? "فشل الدفع" : "Payment failed");
      nav({ to: "/order/$id/failed", params: { id: "NTR-fail" } });
    }
  };

  const busy =
    quoteUi === "loading" || state === "payment_processing" || state === "payment_confirmed";

  return (
    <MobileScreen className="pb-32">
      <TopBar title={t("reviewOrder")} showBack showCart={false} />
      <ScreenBody>
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p>
              {isAr ? "الدفع بعملة " : "Charged in "}
              <span className="font-semibold text-foreground" dir="ltr">
                {quote?.paymentCurrency ?? items[0]?.displayCurrency ?? "SAR"}
              </span>
              {" · "}
              {isAr ? "الأسعار المعروضة بعملة " : "Prices shown in "}
              <span className="font-semibold text-foreground" dir="ltr">
                {quote?.displayCurrency ?? items[0]?.displayCurrency ?? "SAR"}
              </span>
            </p>
            <p className="mt-1">
              {isAr ? "السوق / المنطقة: " : "Market / region: "}
              <span className="font-semibold text-foreground" dir="ltr">
                {quote?.country ?? DEFAULT_MARKET_COUNTRY}
                {quote?.regionCode ? ` · ${quote.regionCode}` : ""}
              </span>
            </p>
          </div>
        </div>

        {quoteUi === "loading" && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-surface py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isAr ? "جاري إنشاء عرض السعر..." : "Creating quote..."}
          </div>
        )}

        {quoteUi === "error" && (
          <QuoteAlert
            tone="danger"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={isAr ? "تعذّر إنشاء العرض" : "Could not create quote"}
            message={quoteError ?? (isAr ? "حاول مرة أخرى" : "Please try again")}
            actionLabel={isAr ? "إعادة المحاولة" : "Retry"}
            onAction={() => void requestQuote(appliedPromo)}
          />
        )}

        {quoteUi === "expired" && (
          <QuoteAlert
            tone="warning"
            icon={<Clock className="h-5 w-5" />}
            title={isAr ? "انتهت صلاحية العرض" : "Quote expired"}
            message={
              isAr ? "يجب طلب عرض سعر جديد قبل الدفع." : "Request a fresh quote before payment."
            }
            actionLabel={isAr ? "تحديث العرض" : "Refresh quote"}
            onAction={() => void refreshQuote()}
          />
        )}

        {quoteUi === "price_changed" && quote && (
          <QuoteAlert
            tone="warning"
            icon={<TrendingUp className="h-5 w-5" />}
            title={isAr ? "تغيّر السعر" : "Price changed"}
            message={
              isAr
                ? "تغيّرت أسعار بعض العناصر. راجع الإجمالي الجديد ثم أكّد."
                : "Some item prices changed. Review the new total, then accept."
            }
            actionLabel={isAr ? "قبول الأسعار الجديدة" : "Accept new prices"}
            onAction={() => void acceptNewPrices()}
            secondaryLabel={isAr ? "تحديث" : "Refresh"}
            onSecondary={() => void refreshQuote()}
          />
        )}

        {quoteUi === "product_unavailable" && (
          <QuoteAlert
            tone="danger"
            icon={<PackageX className="h-5 w-5" />}
            title={isAr ? "منتج غير متاح" : "Product unavailable"}
            message={
              isAr
                ? "عنصر واحد أو أكثر غير متوفر. راجع السلة أو حدّث العرض."
                : "One or more items are unavailable. Review your cart or refresh."
            }
            actionLabel={isAr ? "إعادة المحاولة" : "Retry"}
            onAction={() => void refreshQuote()}
            secondaryLabel={isAr ? "العودة للسلة" : "Back to cart"}
            secondaryTo="/cart"
          />
        )}

        <Section title={t("deliveryInfo")}>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("email")}</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-input bg-surface px-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t("phone")}</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-input bg-surface px-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <input
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>
        </Section>

        {isEnabled("promotionsEnabled") && (
          <Section title={t("promoCode")}>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-input bg-surface px-3">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="NETRO10"
                  dir="ltr"
                  className="h-12 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void applyPromo()}
                disabled={busy}
                className="rounded-full bg-surface px-5 text-sm font-bold disabled:opacity-50"
              >
                {t("apply")}
              </button>
            </div>
          </Section>
        )}

        <Section title={t("paymentMethod")}>
          {enabledMethods.length === 0 ? (
            <CapabilityDisabledPanel
              capability={
                !capabilities.externalPaymentsEnabled && !capabilities.storeCreditEnabled
                  ? "purchasingEnabled"
                  : !capabilities.externalPaymentsEnabled
                    ? "externalPaymentsEnabled"
                    : "storeCreditEnabled"
              }
            />
          ) : (
            <div className="space-y-2">
              {enabledMethods.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors",
                      active ? "border-brand bg-brand/10" : "border-input bg-surface",
                    )}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-background">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold">{m.label}</div>
                      {m.sub && (
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {m.sub}
                        </div>
                      )}
                    </div>
                    {active && <Check className="h-5 w-5 text-brand" />}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {quote && quoteUi !== "loading" && (
          <Section title={isAr ? "عرض السعر" : "Quote"}>
            <div className="rounded-2xl bg-surface p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isAr ? "معرّف العرض" : "Quote ID"}</span>
                <Bidi className="font-mono text-xs">{quote.id}</Bidi>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">
                  {isAr ? "حالة التوفر" : "Availability"}
                </span>
                <span className="font-semibold" dir="ltr">
                  {quote.availabilityStatus}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {isAr ? "ينتهي خلال" : "Expires in"}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-xs font-bold",
                      expired
                        ? "text-destructive"
                        : secondsLeft < 60
                          ? "text-warning"
                          : "text-foreground",
                    )}
                  >
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => void refreshQuote()}
                    className="grid h-7 w-7 place-items-center rounded-full bg-background"
                    aria-label={isAr ? "تحديث" : "Refresh"}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {quote.items.map((line) => (
                  <div key={`${line.productId}-${line.sku}`} className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {isAr ? line.title.ar : line.title.en}
                      </div>
                      <div className="text-[11px] text-muted-foreground" dir="ltr">
                        {line.sku} · ×{line.quantity} ·{" "}
                        {isAr ? line.regionLabel.ar : line.regionLabel.en}
                        {!line.available ? (isAr ? " · غير متاح" : " · unavailable") : ""}
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold">
                      {formatPrice(line.totalPrice, quote.displayCurrency)}
                    </span>
                  </div>
                ))}
              </div>

              {quote.warnings.length > 0 && (
                <div className="mt-3 space-y-1 rounded-xl border border-warning/40 bg-warning/10 p-2 text-xs">
                  {quote.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      <span>
                        {isAr ? w.message.ar : w.message.en}
                        {w.kind === "price_changed" ? ` (${w.oldPrice} → ${w.newPrice})` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        <Section title={t("reviewOrder")}>
          <div className="space-y-1 rounded-2xl bg-surface p-4 text-sm">
            {quote ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {quote.items.length} {isAr ? "عناصر" : "items"}
                  </span>
                  <span>{formatPrice(quote.subtotal, quote.displayCurrency)}</span>
                </div>
                {quote.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>
                      {t("discount")}
                      {quote.promoCode ? ` (${quote.promoCode})` : ""}
                    </span>
                    <span>-{formatPrice(quote.discount, quote.displayCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("vat")} 15%</span>
                  <span>{formatPrice(quote.tax, quote.displayCurrency)}</span>
                </div>
                {quote.fees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isAr ? "رسوم" : "Fees"}</span>
                    <span>{formatPrice(quote.fees, quote.displayCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 font-bold">
                  <span>{t("total")}</span>
                  <span className="font-display text-lg text-brand">
                    {formatPrice(quote.total, quote.currency)}
                  </span>
                </div>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  {isAr
                    ? "الإجمالي من عرض السعر المؤقت فقط — وليس من السلة."
                    : "Total comes from the temporary quote only — not the cart."}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {isAr ? "بانتظار عرض السعر..." : "Waiting for quote..."}
              </p>
            )}
          </div>
        </Section>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 p-3 text-xs text-muted-foreground">
          <Landmark className="h-4 w-4 text-brand" />
          {isAr
            ? "تجريبي: لا يتم إنشاء دفع حقيقي. الدفع محمي عبر 3D-Secure عند الربط."
            : "Demo: no real payment is created. 3D-Secure applies when connected."}
        </div>
      </ScreenBody>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t glass px-4 pt-3">
        <button
          type="button"
          onClick={() => {
            if (expired) {
              void refreshQuote();
              return;
            }
            void submit();
          }}
          disabled={
            busy ||
            enabledMethods.length === 0 ||
            (!quotePayable && !expired) ||
            quoteUi === "product_unavailable" ||
            quoteUi === "error"
          }
          className="h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground shadow-elevated disabled:opacity-50"
        >
          {quoteUi === "loading" && (isAr ? "جاري التحقق..." : "Validating...")}
          {state === "payment_processing" && (isAr ? "جاري الدفع..." : "Processing payment...")}
          {state === "payment_confirmed" && (isAr ? "تم تأكيد الدفع..." : "Payment confirmed...")}
          {expired && quoteUi !== "loading" && (isAr ? "تحديث العرض" : "Refresh quote")}
          {quotePayable &&
            state === "awaiting_payment" &&
            `${t("confirmOrder")} · ${formatPrice(quote!.total, quote!.currency)}`}
          {quoteUi === "price_changed" &&
            !busy &&
            (isAr ? "اقبل الأسعار للمتابعة" : "Accept prices to continue")}
          {quoteUi === "product_unavailable" &&
            !busy &&
            (isAr ? "منتج غير متاح" : "Product unavailable")}
          {quoteUi === "error" && !busy && (isAr ? "إعادة المحاولة" : "Retry")}
          {quoteUi === "idle" &&
            state === "validating_order" &&
            (isAr ? "تحضير..." : "Preparing...")}
        </button>
      </div>
    </MobileScreen>
  );
}

function QuoteAlert({
  tone,
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  secondaryTo,
}: {
  tone: "warning" | "danger";
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryTo?: string;
}) {
  const toneClass =
    tone === "danger"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-warning/30 bg-warning/10 text-warning";
  return (
    <div className={cn("mb-4 rounded-2xl border p-4", toneClass)}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAction}
              className="rounded-full gradient-brand px-4 py-2 text-xs font-bold text-brand-foreground"
            >
              {actionLabel}
            </button>
            {secondaryTo && secondaryLabel && (
              <Link
                to={secondaryTo}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground"
              >
                {secondaryLabel}
              </Link>
            )}
            {onSecondary && secondaryLabel && !secondaryTo && (
              <button
                type="button"
                onClick={onSecondary}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
