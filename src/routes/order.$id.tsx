import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Copy,
  Check,
  Download,
  MessageCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Home,
  RotateCcw,
} from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useOrder } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";
import { usePlatform } from "@/platform/PlatformProvider";
import {
  localizedFulfillmentStatus,
  localizedOrderStatus,
  localizedPaymentStatus,
  localizedRefundStatus,
} from "@/domain/order";
import { cn } from "@/lib/utils";
import { LTR_ATTR, maskDigitalCode } from "@/lib/security";

export const Route = createFileRoute("/order/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { t, locale, formatPrice } = useI18n();
  const isAr = locale === "ar";
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: order, status } = useOrder(id);
  const { clipboard, receipts } = usePlatform();

  useEffect(() => {
    return () => {
      setReveal(false);
      setCopied(false);
    };
  }, [id]);

  if (status === "loading" || !order) {
    return (
      <MobileScreen>
        <TopBar title={id} showBack showCart={false} />
        <ScreenBody>
          <div className="py-16 text-center text-sm text-muted-foreground">{t("loading")}</div>
        </ScreenBody>
      </MobileScreen>
    );
  }

  const item = order.items[0];
  const code = item?.productKind === "gift_card" ? item.code?.value : undefined;
  const showRetry =
    order.displayStatus === "cancelled" ||
    order.displayStatus === "fulfillment_failed" ||
    order.paymentStatus === "failed";
  const showRefundLink =
    order.displayStatus === "refund_pending" || order.displayStatus === "refunded";

  return (
    <MobileScreen>
      <TopBar title={order.id} showBack showCart={false} />
      <ScreenBody>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
              </div>
              <div className="mt-1 font-display text-lg font-bold">{item?.title[locale]}</div>
            </div>
            <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground">
              {localizedOrderStatus(order.displayStatus, locale)}
            </span>
          </div>

          <div className="mt-4 space-y-2 rounded-xl bg-surface/60 p-3 text-sm">
            <StatusRow
              label={isAr ? "الدفع" : "Payment"}
              value={localizedPaymentStatus(order.paymentStatus, locale)}
            />
            <StatusRow
              label={isAr ? "التنفيذ" : "Fulfillment"}
              value={localizedFulfillmentStatus(order.fulfillmentStatus, locale)}
            />
            <StatusRow
              label={isAr ? "الاسترداد" : "Refund"}
              value={localizedRefundStatus(order.refundStatus, locale)}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("quantity")}</span>
            <span className="font-semibold">{item?.quantity}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("paymentMethod")}</span>
            <span className="font-semibold">{order.paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="font-bold">{t("total")}</span>
            <span className="font-display text-lg font-black text-brand">
              {formatPrice(order.total, order.paymentCurrency)}
            </span>
          </div>
        </div>

        {code && (
          <div className="mt-4 rounded-2xl gradient-hero p-5 text-white shadow-elevated">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/70">
              {t("yourCode")}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="font-mono text-xl font-black tracking-wider" {...LTR_ATTR}>
                {reveal ? code : maskDigitalCode(code)}
              </div>
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur"
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const didCopy = await clipboard.writeText(code);
                  if (!didCopy) {
                    toast.error(isAr ? "تعذر النسخ" : "Could not copy");
                    return;
                  }
                  setCopied(true);
                  toast.success(t("copied"));
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-bold text-black"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("copied") : t("copy")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void receipts.save({
                    filename: `${order.id}-receipt.txt`,
                    mimeType: "text/plain;charset=utf-8",
                    encoding: "utf8",
                    data: [
                      `NETRO receipt`,
                      `Order: ${order.id}`,
                      `Product: ${item?.title[locale] ?? ""}`,
                      `Quantity: ${item?.quantity ?? 0}`,
                      `Total: ${formatPrice(order.total, order.paymentCurrency)}`,
                      `Payment: ${order.paymentMethod}`,
                      `Display: ${order.displayStatus}`,
                      `Payment status: ${order.paymentStatus}`,
                      `Fulfillment: ${order.fulfillmentStatus}`,
                      `Refund: ${order.refundStatus}`,
                    ].join("\n"),
                  });
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/40 py-2.5 text-xs font-bold text-white"
              >
                <Download className="h-3.5 w-3.5" /> {t("downloadReceipt")}
              </button>
            </div>
          </div>
        )}

        <h3 className="mb-3 mt-6 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {t("orderTimeline")}
        </h3>
        <div className="space-y-3">
          {order.events.map((e, i) => (
            <div key={i} className="flex gap-3">
              <div className="relative">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {i < order.events.length - 1 && (
                  <span className="absolute left-1/2 top-6 h-8 w-px -translate-x-1/2 bg-success" />
                )}
              </div>
              <div className="pb-4">
                <div className="text-sm font-semibold">{e.note?.[locale]}</div>
                <div className="text-xs text-muted-foreground">
                  {localizedOrderStatus(e.displayStatus, locale)}
                </div>
                {e.at && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          {showRetry && (
            <Link
              to="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-4 text-sm font-semibold text-brand-foreground"
            >
              <RotateCcw className="h-4 w-4" /> {t("retry")}
            </Link>
          )}
          {showRefundLink && (
            <Link
              to="/order/$id/refund"
              params={{ id: order.id }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-4 text-sm font-semibold"
            >
              {order.displayStatus === "refunded"
                ? isAr
                  ? "تفاصيل الاسترداد"
                  : "Refund details"
                : isAr
                  ? "متابعة الاسترداد"
                  : "Track refund"}
            </Link>
          )}
          {order.displayStatus === "fulfillment_processing" ||
          order.displayStatus === "payment_confirmed" ? (
            <Link
              to="/order/$id/fulfillment"
              params={{ id: order.id }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-4 text-sm font-semibold"
            >
              {isAr ? "متابعة التنفيذ" : "Track fulfillment"}
            </Link>
          ) : null}
          <Link
            to="/support/new"
            search={{ orderId: order.id, itemId: item?.id }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-4 text-sm font-semibold"
          >
            <MessageCircle className="h-4 w-4" /> {t("contactSupport")}
          </Link>
          <Link
            to="/home"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-muted-foreground",
            )}
          >
            <Home className="h-4 w-4" /> {isAr ? "العودة للرئيسية" : "Return home"}
          </Link>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
