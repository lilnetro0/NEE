import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody, BottomNav } from "@/components/shell/Shell";
import type { OrderListBucket } from "@/domain/order";
import { localizedOrderStatus, toOrderListBucket } from "@/domain/order";
import { useOrders } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  component: Orders,
});

const filters: (OrderListBucket | "all")[] = [
  "all",
  "processing",
  "completed",
  "failed",
  "refunded",
  "cancelled",
];

function statusColor(bucket: OrderListBucket) {
  if (bucket === "completed") return "bg-success/15 text-success";
  if (bucket === "processing") return "bg-warning/15 text-warning";
  if (bucket === "failed") return "bg-destructive/15 text-destructive";
  if (bucket === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function Orders() {
  const { t, locale, formatPrice } = useI18n();
  const [f, setF] = useState<OrderListBucket | "all">("all");
  const { data: orders = [] } = useOrders(f === "all" ? undefined : f);
  const list = orders;

  return (
    <MobileScreen>
      <TopBar title={t("nav_orders")} />
      <ScreenBody>
        <div className="no-scrollbar mb-4 -mx-4 flex gap-2 overflow-x-auto px-4">
          {filters.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setF(k)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-semibold",
                f === k ? "bg-brand text-brand-foreground" : "bg-surface text-muted-foreground",
              )}
            >
              {t(k as never)}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t("empty_orders")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((o) => {
              const bucket = toOrderListBucket(o.displayStatus);
              return (
                <Link
                  key={o.id}
                  to="/order/$id"
                  params={{ id: o.id }}
                  className="block rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        statusColor(bucket),
                      )}
                    >
                      {localizedOrderStatus(o.displayStatus, locale)}
                    </span>
                  </div>
                  <div className="mt-2 font-semibold">{o.items[0]?.title[locale]}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(o.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-SA" : "en-US",
                      )}
                    </span>
                    <span className="font-bold text-brand">
                      {formatPrice(o.total, o.paymentCurrency)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
