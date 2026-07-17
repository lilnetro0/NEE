import { Link } from "@tanstack/react-router";
import { Heart, Zap } from "lucide-react";
import type { Brand, Category } from "@/data/catalog";
import type { Product } from "@/domain/product";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";

export function ProductArt({ product, className }: { product: Product; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-3xl", className)}
      style={{
        background: `linear-gradient(135deg, ${product.color} 0%, ${product.color}bb 60%, #0008 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(255,255,255,.35), transparent 40%), radial-gradient(circle at 80% 90%, rgba(0,0,0,.4), transparent 40%)",
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-3xl font-black tracking-tight text-white/95 drop-shadow">
          NETRO
        </span>
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-white/90">
        <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">
          Digital
        </span>
        {product.kind === "direct_topup" && product.game.platform && (
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            {product.game.platform}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProductCard({ product, size = "sm" }: { product: Product; size?: "sm" | "md" }) {
  const { locale, formatPrice, t } = useI18n();
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(product.id);
  const w = size === "sm" ? "w-40" : "w-44";
  return (
    <Link to="/product/$id" params={{ id: product.id }} className={cn("group block shrink-0", w)}>
      <div className="relative">
        <ProductArt product={product} className="aspect-[4/5] w-full" />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/40 backdrop-blur active:scale-95"
          aria-label="Favorite"
        >
          <Heart className={cn("h-4 w-4", fav ? "fill-white text-white" : "text-white")} />
        </button>
        {product.compareAt && (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            -{Math.round(((product.compareAt - product.fromPrice) / product.compareAt) * 100)}%
          </span>
        )}
        {(product.kind === "gift_card"
          ? product.pinDelivery.instant
          : product.fulfillmentEstimateMinutes <= 1) && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Zap className="h-3 w-3" /> {t("instant")}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-0.5 px-0.5">
        <div className="line-clamp-1 text-sm font-semibold">{product.title[locale]}</div>
        <div className="line-clamp-1 text-[11px] text-muted-foreground">
          {product.region.name[locale]} ·{" "}
          {product.kind === "direct_topup"
            ? (product.game.platform ?? product.game.name[locale])
            : t("giftCards")}
        </div>
        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-sm font-bold text-brand">
            {formatPrice(product.fromPrice, product.displayCurrency)}
          </span>
          {product.compareAt && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatPrice(product.compareAt, product.displayCurrency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CategoryTile({ cat }: { cat: Category }) {
  const { locale } = useI18n();
  return (
    <Link
      to="/categories/$slug"
      params={{ slug: cat.id }}
      className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl p-3 active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${cat.color}55 0%, ${cat.color}20 100%)`,
        borderColor: `${cat.color}44`,
      }}
    >
      <span className="text-3xl">{cat.icon}</span>
      <span className="line-clamp-2 text-sm font-semibold leading-tight">{cat.name[locale]}</span>
    </Link>
  );
}

export function BrandTile({ brand }: { brand: Brand }) {
  return (
    <Link
      to="/brands/$slug"
      params={{ slug: brand.id }}
      className="flex w-24 shrink-0 flex-col items-center gap-2"
    >
      <div
        className="grid h-16 w-16 place-items-center rounded-2xl text-2xl font-black text-white shadow-card"
        style={{ background: `linear-gradient(135deg, ${brand.color}, ${brand.color}dd)` }}
      >
        {brand.logo || brand.name.slice(0, 1)}
      </div>
      <div className="line-clamp-1 w-full text-center text-[11px] font-medium text-muted-foreground">
        {brand.name}
      </div>
    </Link>
  );
}

export function HScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1", className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, to }: { title: string; to?: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {to && (
        <Link to={to as never} className="text-xs font-semibold text-brand">
          {t("seeAll")}
        </Link>
      )}
    </div>
  );
}
