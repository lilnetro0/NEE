import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { quotesApi, ordersApi } from "@/api/services";
import type { Quote } from "@/domain/order";
import type { CheckoutState } from "@/domain/order";
import { resolveCapabilities } from "@/platform/capabilities";
import { device } from "@/platform/adapters";
import { Bidi } from "@/components/common/Bidi";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

type Method = "mada" | "visa" | "applepay" | "stcpay" | "credit";

/**
 * Checkout flow with explicit state machine:
 *   draft → validating → awaiting_payment → payment_processing
 *         → payment_authorized → order_created → fulfillment_pending
 *
 * Quote-based: a Quote with an expiration is created up front. Price /
 * stock changes surface as warnings; the user can refresh to get a new one.
 */
function Checkout() {
  const { t, locale, formatPrice } = useI18n();
  const isAr = locale === "ar";
  const { items, subtotal, clear } = useStore();
  const nav = useNavigate();

  // Contact
  const [email, setEmail] = useState("ahmad@example.com");
  const [phone, setPhone] = useState("+9665");
  const [method, setMethod] = useState<Method>("mada");

  // State machine
  const [state, setState] = useState<CheckoutState>("draft");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [now, setNow] = useState(Date.now());
  const abortRef = useRef(false);

  const caps = useMemo(
    () =>
      resolveCapabilities({ platform: device.info().platform, country: "SA", appVersion: "1.0.0" }),
    [],
  );

  const methods: {
    id: Method;
    label: string;
    icon: typeof CreditCard;
    sub?: string;
    enabled: boolean;
  }[] = [
    { id: "mada", label: "Mada", icon: CreditCard, sub: "•• 4421", enabled: caps.mada },
    { id: "visa", label: "Visa / Mastercard", icon: CreditCard, enabled: caps.visa },
    { id: "applepay", label: "Apple Pay", icon: Apple, enabled: caps.apple_pay },
    { id: "stcpay", label: "STC Pay", icon: Smartphone, enabled: caps.stc_pay },
    {
      id: "credit",
      label: isAr ? "رصيد NETRO" : "NETRO Credit",
      icon: Wallet,
      sub: formatPrice(42.5, "SAR"),
      enabled: caps.store_credit_pay,
    },
  ];

  // Create initial quote once cart is populated.
  useEffect(() => {
    if (items.length === 0 || quote) return;
    setState("validating");
    quotesApi
      .create({
        items: items.map((i) => ({
          productId: i.productId,
          sku: i.kind === "gift_card" ? i.denomination.id : i.package.id,
          quantity: i.quantity,
          fulfillmentFields: i.kind === "direct_topup" ? i.fulfillmentFields : undefined,
        })),
        country: "SA",
        displayCurrency: "SAR",
        paymentCurrency: "SAR",
      })
      .then((q) => {
        if (abortRef.current) return;
        setQuote({ ...q, subtotal, total: subtotal * 1.15, vat: subtotal * 0.15 });
        setState("awaiting_payment");
      })
      .catch(() => setState("draft"));
    return () => {
      abortRef.current = true;
    };
  }, [items, quote, subtotal]);

  // Tick every second to track quote expiration.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = quote
    ? Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - now) / 1000))
    : 0;
  const expired = quote && secondsLeft === 0;

  const refreshQuote = async () => {
    if (!quote) return;
    setState("validating");
    try {
      const q = await quotesApi.refresh(quote.id);
      setQuote({ ...q, subtotal, total: subtotal * 1.15, vat: subtotal * 0.15 });
      setState("awaiting_payment");
      toast.success(isAr ? "تم تحديث السعر" : "Quote refreshed");
    } catch {
      setState("awaiting_payment");
      toast.error(isAr ? "فشل التحديث" : "Refresh failed");
    }
  };

  const submit = async () => {
    if (!quote || expired) return;
    setState("payment_processing");
    try {
      // Simulate 3DS return with a small delay; a real integration parses
      // paymentReturn from URL search when redirected back.
      await new Promise((r) => setTimeout(r, 700));
      setState("payment_authorized");
      await new Promise((r) => setTimeout(r, 300));

      const order = await ordersApi.create({ quoteId: quote.id, paymentMethod: method });
      setState("order_created");
      clear();
      // Kick off fulfillment; land on a status screen (not "success").
      nav({ to: "/order/$id/fulfillment", params: { id: order.id } });
    } catch (e) {
      console.error(e);
      setState("awaiting_payment");
      toast.error(isAr ? "فشل الدفع" : "Payment failed");
      nav({ to: "/order/$id/failed", params: { id: "NTR-fail" } });
    }
  };

  const total = quote?.total ?? subtotal * 1.15;
  const busy =
    state === "validating" || state === "payment_processing" || state === "payment_authorized";

  return (
    <MobileScreen className="pb-32">
      <TopBar title={t("reviewOrder")} showBack showCart={false} />
      <ScreenBody>
        {/* Currency separation banner */}
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            {isAr ? "الدفع بعملة " : "Charged in "}
            <span className="font-semibold text-foreground" dir="ltr">
              {quote?.paymentCurrency ?? "SAR"}
            </span>
            {" · "}
            {isAr ? "الأسعار المعروضة بعملة " : "Prices shown in "}
            <span className="font-semibold text-foreground" dir="ltr">
              {quote?.displayCurrency ?? "SAR"}
            </span>
          </p>
        </div>

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

        <Section title={t("paymentMethod")}>
          <div className="space-y-2">
            {methods
              .filter((m) => m.enabled)
              .map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
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
        </Section>

        {quote && (
          <Section title={isAr ? "عرض السعر" : "Quote"}>
            <div className="rounded-2xl bg-surface p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isAr ? "معرّف العرض" : "Quote ID"}</span>
                <Bidi className="font-mono text-xs">{quote.id}</Bidi>
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
                    onClick={refreshQuote}
                    className="grid h-7 w-7 place-items-center rounded-full bg-background"
                    aria-label={isAr ? "تحديث" : "Refresh"}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {quote.warnings.length > 0 && (
                <div className="mt-3 space-y-1 rounded-xl border border-warning/40 bg-warning/10 p-2 text-xs">
                  {quote.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      <span>
                        {"message" in w ? (isAr ? w.message.ar : w.message.en) : `${w.kind}`}
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">{items.length} items</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("vat")} 15%</span>
              <span>{formatPrice(subtotal * 0.15)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>{t("total")}</span>
              <span className="font-display text-lg text-brand">{formatPrice(total)}</span>
            </div>
          </div>
        </Section>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 p-3 text-xs text-muted-foreground">
          <Landmark className="h-4 w-4 text-brand" />
          {isAr ? "الدفع محمي عبر 3D-Secure." : "Payments processed securely. 3D-Secure enabled."}
        </div>
      </ScreenBody>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t glass px-4 pt-3">
        <button
          onClick={submit}
          disabled={busy || !quote || !!expired || items.length === 0}
          className="h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground shadow-elevated disabled:opacity-50"
        >
          {state === "validating" && (isAr ? "جاري التحقق..." : "Validating...")}
          {state === "payment_processing" && (isAr ? "جاري الدفع..." : "Processing payment...")}
          {state === "payment_authorized" && (isAr ? "تم التفويض..." : "Authorized...")}
          {state === "awaiting_payment" &&
            !expired &&
            `${t("confirmOrder")} · ${formatPrice(total)}`}
          {expired && (isAr ? "انتهت صلاحية العرض — حدّث" : "Quote expired — refresh")}
          {state === "draft" && (isAr ? "تحضير..." : "Preparing...")}
        </button>
      </div>
    </MobileScreen>
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
