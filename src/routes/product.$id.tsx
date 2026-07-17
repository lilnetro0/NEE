import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Star, Zap, Shield, Info, Minus, Plus, AlertTriangle } from "lucide-react";
import { MobileScreen, TopBar } from "@/components/shell/Shell";
import { ProductArt, ProductCard, SectionHeader, HScroll } from "@/components/shell/Cards";
import { useProduct, useProducts } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, status } = useProduct(id);
  const { data: products = [] } = useProducts();
  const { locale, t, formatPrice } = useI18n();
  const { add, isFavorite, toggleFavorite } = useStore();
  const nav = useNavigate();

  const [tab, setTab] = useState<"desc" | "redeem" | "reviews">("desc");
  const [denominationId, setDenominationId] = useState<string | undefined>();
  const [pkgId, setPkgId] = useState<string | undefined>();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    if (product.kind === "gift_card") {
      setDenominationId(product.denominations[0]?.id);
      setPkgId(undefined);
    } else {
      setPkgId(product.packages[0]?.id);
      setDenominationId(undefined);
    }
  }, [product]);

  if (status === "loading") {
    return (
      <MobileScreen>
        <TopBar title="" showBack />
        <div className="p-6 text-center text-sm text-muted-foreground">{t("loading")}</div>
      </MobileScreen>
    );
  }

  if (!product) {
    return (
      <MobileScreen>
        <TopBar title="Not found" showBack />
        <div className="p-6 text-center text-sm text-muted-foreground">Product not found.</div>
      </MobileScreen>
    );
  }

  const denomination =
    product.kind === "gift_card"
      ? product.denominations.find((item) => item.id === denominationId)
      : undefined;
  const pkg =
    product.kind === "direct_topup"
      ? product.packages.find((item) => item.id === pkgId)
      : undefined;
  const unitPrice = denomination?.price ?? pkg?.price ?? product.fromPrice;
  const total = unitPrice * qty;
  const fav = isFavorite(product.id);
  const related = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 6);

  const isTopUp = product.kind === "direct_topup";

  const startBuy = (buyNow = false) => {
    if (isTopUp) {
      nav({
        to: "/product/$id/topup",
        params: { id: product.id },
        search: { pkg: pkgId, qty } as never,
      });
      return;
    }
    if (product.kind !== "gift_card" || !denomination) return;
    const err = add({
      key: `${product.id}-${denomination.id}`,
      productId: product.id,
      kind: "gift_card",
      title: product.title[locale],
      denomination,
      regionCode: product.region.code,
      regionLabel: product.region.name[locale],
      redemptionCurrency: product.redemptionCurrency,
      displayCurrency: product.displayCurrency,
      quantity: qty,
      unitPrice,
      color: product.color,
    });
    if (err) {
      toast.error(err.message);
      return;
    }

    toast.success(t("addToCart"));
    if (buyNow) nav({ to: "/cart" });
  };

  return (
    <MobileScreen className="pb-32">
      <TopBar
        showBack
        transparent
        title=""
        right={
          <button
            onClick={() => toggleFavorite(product.id)}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface active:scale-95"
          >
            <Heart className={cn("h-5 w-5", fav && "fill-brand text-brand")} />
          </button>
        }
      />

      <div className="px-4">
        <ProductArt product={product} className="aspect-[5/4] w-full" />

        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{product.region.name[locale]}</span>·
            <span>
              {product.kind === "direct_topup"
                ? (product.game.platform ?? product.game.name[locale])
                : product.brandId}
            </span>
            {(product.kind === "gift_card"
              ? product.pinDelivery.instant
              : product.fulfillmentEstimateMinutes <= 1) && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-semibold text-success">
                <Zap className="h-3 w-3" /> {t("instant")}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-black leading-tight">
            {product.title[locale]}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-warning text-warning" />
              {product.rating}
              <span className="text-muted-foreground">({product.reviewsCount})</span>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                product.inStock
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {product.inStock ? t("inStock") : t("outOfStock")}
            </span>
          </div>

          {/* Denominations */}
          {product.kind === "gift_card" && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("denomination")}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.denominations.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDenominationId(d.id)}
                    className={cn(
                      "rounded-2xl border-2 py-3 text-sm font-bold transition-colors",
                      denominationId === d.id
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-input bg-surface",
                    )}
                  >
                    {d.faceValue}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Packages */}
          {product.kind === "direct_topup" && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Packages
              </div>
              <div className="space-y-2">
                {product.packages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPkgId(p.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition-colors",
                      pkgId === p.id ? "border-brand bg-brand/10" : "border-input bg-surface",
                    )}
                  >
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-sm font-bold text-brand">
                      {formatPrice(p.price, product.displayCurrency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isTopUp && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <p className="text-xs leading-relaxed text-warning-foreground/90 dark:text-warning">
                {t("playerIdWarn")}
              </p>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-semibold">{t("quantity")}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-10 w-10 place-items-center rounded-full bg-surface"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="grid h-10 w-10 place-items-center rounded-full bg-surface"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 rounded-2xl bg-surface p-1">
            {(
              [
                ["desc", t("description")],
                ["redeem", t("howToRedeem")],
                ["reviews", t("reviews")],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-xs font-semibold",
                  tab === k ? "bg-background shadow-card" : "text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {tab === "desc" && product.description[locale]}
            {tab === "redeem" && (
              <div className="space-y-3">
                <p>
                  {product.kind === "gift_card"
                    ? product.redemptionInstructions[locale]
                    : product.description[locale]}
                </p>
                {product.kind === "gift_card" && product.restrictions && (
                  <div className="flex gap-2 rounded-2xl bg-surface p-3 text-xs">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div>
                      <b className="text-foreground">{t("regionRestrictions")}: </b>
                      {product.restrictions[locale]}
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === "reviews" && (
              <div className="space-y-3">
                {[
                  { name: "Khalid", stars: 5, comment: "Fast delivery, worked instantly." },
                  { name: "Sara", stars: 4, comment: "Great service, will buy again." },
                  { name: "Faisal", stars: 5, comment: "Perfect, code arrived in seconds." },
                ].map((r, i) => (
                  <div key={i} className="rounded-2xl bg-surface p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <b className="text-sm text-foreground">{r.name}</b>
                      <div className="flex">
                        {Array.from({ length: r.stars }).map((_, j) => (
                          <Star key={j} className="h-3 w-3 fill-warning text-warning" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-surface p-3 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-brand" />
            Secure purchase · Refund eligible per policy
          </div>

          {related.length > 0 && (
            <>
              <SectionHeader title={t("related")} />
              <HScroll>
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </HScroll>
            </>
          )}
        </div>
      </div>

      {/* Sticky bottom action */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t glass px-4 pt-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">{t("total")}</span>
          <span className="font-display text-xl font-black text-brand">
            {formatPrice(total, product.displayCurrency)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => startBuy(false)}
            className="h-14 flex-1 rounded-full border-2 border-brand text-sm font-bold text-brand active:scale-95"
          >
            {t("addToCart")}
          </button>
          <button
            onClick={() => startBuy(true)}
            className="h-14 flex-1 rounded-full gradient-brand text-sm font-bold text-brand-foreground shadow-elevated active:scale-95"
          >
            {t("buyNow")}
          </button>
        </div>
      </div>
    </MobileScreen>
  );
}
