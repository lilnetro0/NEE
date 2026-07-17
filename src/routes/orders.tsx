import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody, BottomNav } from "@/components/shell/Shell";
import type { OrderListBucket } from "@/domain/order";
import { localizedOrderStatus, toOrderListBucket } from "@/domain/order";
import { useOrders } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { RequireAuth } from "@/auth/RequireAuth";
import { AsyncState } from "@/components/common/AsyncState";

export const Route = createFileRoute("/orders")({
  component: OrdersRoute,
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

function OrdersRoute() {
  return (
    <RequireAuth>
      <Orders />
    </RequireAuth>
  );
}

function Orders() {
  const { t, locale, formatPrice } = useI18n();
  const [f, setF] = useState<OrderListBucket | "all">("all");
  const { status, data: orders = [], error, reload } = useOrders(
    f === "all" ? undefined : f,
  );
  const list = orders;

  return (
    <MobileScreen>
      <TopBar title={t("nav_orders")} />
      <ScreenBody className="pb-24">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setF(id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                f === id ? "gradient-brand text-brand-foreground" : "bg-secondary text-foreground",
              )}
            >
              {id === "all" ? t("all") : t(id)}
            </button>
          ))}
        </div>

        <AsyncState
          status={status === "ready" && list.length === 0 ? "empty" : status}
          data={list}
          error={error?.message ?? null}
          onRetry={reload}
          emptyLabel={t("empty_orders")}
          emptyIcon={<Package className="h-8 w-8" aria-hidden />}
        >
          {(items) => (
            <div className="space-y-3">
              {items.map((order) => {
                const bucket = toOrderListBucket(order.displayStatus);
                return (
                  <Link
                    key={order.id}
                    to="/order/$id"
                    params={{ id: order.id }}
                    className="block rounded-2xl border border-border/60 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold" dir="ltr">
                          {order.id.slice(0, 8)}…
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar" : "en")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                          statusColor(bucket),
                        )}
                      >
                        {localizedOrderStatus(order.displayStatus, locale)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold" dir="ltr">
                      {formatPrice(order.total, order.paymentCurrency)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </AsyncState>
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
