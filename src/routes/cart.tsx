import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag, Ticket } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  component: Cart,
});

function Cart() {
  const { t, formatPrice } = useI18n();
  const { items, remove, updateQty, subtotal } = useStore();
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const nav = useNavigate();

  const vat = (subtotal - discount) * 0.15;
  const total = subtotal - discount + vat;

  if (items.length === 0) {
    return (
      <MobileScreen>
        <TopBar title={t("checkout")} showBack showCart={false} />
        <ScreenBody className="mt-24 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-surface">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("cartEmpty")}</p>
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

  return (
    <MobileScreen className="pb-32">
      <TopBar title={t("checkout")} showBack showCart={false} />
      <ScreenBody>
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.key} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${it.color}, ${it.color}bb)` }}
              >
                N
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-semibold">{it.title}</div>
                <div className="text-xs text-muted-foreground">
                  {it.kind === "direct_topup"
                    ? it.package.label
                    : `${it.denomination.faceValue} ${it.redemptionCurrency}`}
                  {" · "}
                  {it.regionLabel}
                </div>
                {it.kind === "direct_topup" && it.fulfillmentFields.playerId && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    ID:{" "}
                    <span className="font-mono" dir="ltr">
                      {it.fulfillmentFields.playerId}
                    </span>
                    {it.fulfillmentFields.server && ` · Srv ${it.fulfillmentFields.server}`}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(it.key, it.quantity - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-surface"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{it.quantity}</span>
                    <button
                      onClick={() => updateQty(it.key, it.quantity + 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-surface"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-bold text-brand">
                    {formatPrice(it.unitPrice * it.quantity, it.displayCurrency)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove(it.key)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-input bg-surface px-3">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder={t("promoCode")}
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => {
              if (promo.trim().toUpperCase() === "NETRO10") {
                setDiscount(subtotal * 0.1);
                toast.success("Promo applied: 10% off");
              } else {
                toast.error("Invalid code");
              }
            }}
            className="rounded-full bg-surface px-5 text-sm font-bold"
          >
            {t("apply")}
          </button>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl bg-surface p-4 text-sm">
          <Row label={t("subtotal")} value={formatPrice(subtotal)} />
          {discount > 0 && <Row label={t("discount")} value={"-" + formatPrice(discount)} accent />}
          <Row label={t("vat") + " 15%"} value={formatPrice(vat)} />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
            <span className="font-bold">{t("total")}</span>
            <span className="font-display text-xl font-black text-brand">{formatPrice(total)}</span>
          </div>
        </div>
      </ScreenBody>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t glass px-4 pt-3">
        <button
          onClick={() => nav({ to: "/checkout" })}
          className="h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground shadow-elevated"
        >
          {t("checkout")} · {formatPrice(total)}
        </button>
      </div>
    </MobileScreen>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "font-semibold text-success" : "font-semibold"}>{value}</span>
    </div>
  );
}
