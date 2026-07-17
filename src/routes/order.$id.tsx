import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Download, MessageCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useOrder } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/order/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { t, locale, formatPrice } = useI18n();
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: order, status } = useOrder(id);

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

  return (
    <MobileScreen>
      <TopBar title={order.id} showBack showCart={false} />
      <ScreenBody>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
          </div>
          <div className="mt-1 font-display text-lg font-bold">{item?.title[locale]}</div>
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
              <div className="font-mono text-xl font-black tracking-wider">
                {reveal ? code : "•••• •••• •••• ••••"}
              </div>
              <button
                onClick={() => setReveal((v) => !v)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur"
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(code);
                  setCopied(true);
                  toast.success(t("copied"));
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-bold text-black"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("copied") : t("copy")}
              </button>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/40 py-2.5 text-xs font-bold text-white">
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
                {e.at && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-4 text-sm font-semibold">
          <MessageCircle className="h-4 w-4" /> {t("contactSupport")}
        </button>
      </ScreenBody>
    </MobileScreen>
  );
}
