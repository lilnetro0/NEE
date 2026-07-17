import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Flame, Sparkles } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import {
  BrandTile,
  CategoryTile,
  HScroll,
  ProductCard,
  SectionHeader,
} from "@/components/shell/Cards";
import { useI18n } from "@/i18n/I18nProvider";
import { useBrands, useCategories, useCurrentUser, useProducts } from "@/data-access";
import { useCapabilities } from "@/platform/useCapabilities";

export const Route = createFileRoute("/home")({
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: user } = useCurrentUser();
  const { isEnabled } = useCapabilities();

  const featured = products
    .filter((p) => p.tags?.includes("bestseller") || p.tags?.includes("new"))
    .slice(0, 8);
  const offers = products.filter((p) => p.compareAt).slice(0, 8);
  const topups = isEnabled("directGameTopUpEnabled")
    ? products.filter((p) => p.kind === "direct_topup").slice(0, 8)
    : [];
  const gifts = isEnabled("giftCardPurchaseEnabled")
    ? products.filter((p) => p.kind === "gift_card").slice(0, 8)
    : [];
  const firstName = user?.displayName.split(" ")[0] ?? "Ahmad";
  const visibleCategories = categories.filter((c) => {
    if (c.id === "top-ups") return isEnabled("directGameTopUpEnabled");
    if (c.id === "gift-cards") return isEnabled("giftCardPurchaseEnabled");
    return true;
  });

  return (
    <MobileScreen>
      <TopBar
        title={
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {t("hello")} 👋
            </div>
            <div className="font-display text-lg font-bold">{firstName}</div>
          </div>
        }
      />
      <ScreenBody>
        <Link
          to="/search"
          className="flex h-12 items-center gap-2 rounded-2xl border border-input bg-surface px-4 text-sm text-muted-foreground"
        >
          <Search className="h-4 w-4" />
          {t("search")}...
        </Link>

        <div className="relative mt-4 overflow-hidden rounded-3xl gradient-hero p-5 text-white shadow-elevated">
          <div className="pointer-events-none absolute -right-8 -top-6 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-cyan/25 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
              <Flame className="h-3 w-3" /> Flash deal
            </div>
            <div className="mt-3 font-display text-2xl font-black leading-tight">
              25% off Spotify Premium
            </div>
            <p className="mt-1 text-sm text-white/80">Redeemable in KSA · Today only</p>
            <button className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-black">
              Shop now
            </button>
          </div>
        </div>

        <SectionHeader title={t("browseCategories")} to="/categories" />
        <HScroll>
          {visibleCategories.slice(0, 8).map((c) => (
            <div key={c.id} className="w-24 shrink-0">
              <CategoryTile cat={c} />
            </div>
          ))}
        </HScroll>

        <SectionHeader title={t("bestSellers")} to="/search" />
        <HScroll>
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </HScroll>

        {gifts.length > 0 && (
          <>
            <SectionHeader title={t("giftCards")} to="/categories/gift-cards" />
            <HScroll>
              {gifts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </HScroll>
          </>
        )}

        {topups.length > 0 && (
          <>
            <SectionHeader title={t("topUps")} to="/categories/top-ups" />
            <HScroll>
              {topups.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </HScroll>
          </>
        )}

        {offers.length > 0 && (
          <>
            <SectionHeader title={t("specialOffers")} />
            <div className="grid grid-cols-2 gap-3">
              {offers.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} size="md" />
              ))}
            </div>
          </>
        )}

        <SectionHeader title={t("brands")} to="/categories" />
        <HScroll>
          {brands.slice(0, 12).map((b) => (
            <BrandTile key={b.id} brand={b} />
          ))}
        </HScroll>

        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-xs">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="text-muted-foreground">
            Instant delivery to your inbox · Secure & verified
          </span>
        </div>
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
