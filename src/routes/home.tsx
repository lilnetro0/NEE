import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { BrandTile, CategoryTile, HScroll, SectionHeader } from "@/components/shell/Cards";
import { useI18n } from "@/i18n/I18nProvider";
import { useBrands, useCategories, useCurrentUser, useProducts } from "@/data-access";
import { useCapabilities } from "@/platform/useCapabilities";
import { AsyncState } from "@/components/common/AsyncState";
import { HomeSkeleton } from "@/components/common/Skeletons";
import type { Product } from "@/domain/product";

export const Route = createFileRoute("/home")({
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();
  const { data: user } = useCurrentUser();
  const { isEnabled } = useCapabilities();

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const brands = brandsQuery.data ?? [];

  const catalogStatus =
    productsQuery.status === "error" ||
    categoriesQuery.status === "error" ||
    brandsQuery.status === "error"
      ? "error"
      : productsQuery.status === "loading" ||
          categoriesQuery.status === "loading" ||
          brandsQuery.status === "loading"
        ? "loading"
        : productsQuery.status === "empty"
          ? "empty"
          : "ready";

  const brandsFor = (predicate: (product: Product) => boolean) => {
    const brandIds = new Set(products.filter(predicate).map((product) => product.brandId));
    return brands.filter((brand) => brandIds.has(brand.id)).slice(0, 8);
  };
  const featured = brandsFor(
    (product) =>
      product.tags?.includes("bestseller") === true || product.tags?.includes("new") === true,
  );
  const offers = brandsFor((product) => Boolean(product.compareAt));
  const topups = isEnabled("directGameTopUpEnabled")
    ? brandsFor((product) => product.kind === "direct_topup")
    : [];
  const gifts = isEnabled("giftCardPurchaseEnabled")
    ? brandsFor((product) => product.kind === "gift_card")
    : [];
  const firstName = user?.displayName?.split(" ")[0] ?? t("welcome");
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
              {t("hello")}
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

        <div className="relative mt-3 overflow-hidden rounded-3xl gradient-hero p-4 text-white shadow-elevated">
          <div className="relative">
            <div className="font-display text-xl font-black leading-tight">
              {t("home_browseCtaTitle")}
            </div>
            <p className="mt-1 text-sm text-white/80">{t("home_browseCtaBody")}</p>
            <Link
              to="/categories"
              className="mt-3 inline-flex min-h-9 items-center rounded-full bg-white px-4 py-2 text-xs font-bold text-black active:scale-[0.97]"
            >
              {t("home_browseCtaAction")}
            </Link>
          </div>
        </div>

        <AsyncState
          status={catalogStatus}
          data={products as Product[]}
          error={
            productsQuery.error?.message ??
            categoriesQuery.error?.message ??
            brandsQuery.error?.message ??
            null
          }
          onRetry={() => {
            productsQuery.reload();
            categoriesQuery.reload();
            brandsQuery.reload();
          }}
          emptyLabel={t("empty_search")}
          skeleton={<HomeSkeleton />}
        >
          {() => (
            <>
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
                {featured.map((brand) => (
                  <BrandTile key={brand.id} brand={brand} />
                ))}
              </HScroll>

              {gifts.length > 0 && (
                <>
                  <SectionHeader title={t("giftCards")} to="/categories/gift-cards" />
                  <HScroll>
                    {gifts.map((brand) => (
                      <BrandTile key={brand.id} brand={brand} />
                    ))}
                  </HScroll>
                </>
              )}

              {topups.length > 0 && (
                <>
                  <SectionHeader title={t("topUps")} to="/categories/top-ups" />
                  <HScroll>
                    {topups.map((brand) => (
                      <BrandTile key={brand.id} brand={brand} />
                    ))}
                  </HScroll>
                </>
              )}

              {offers.length > 0 && (
                <>
                  <SectionHeader title={t("specialOffers")} />
                  <div className="grid grid-cols-4 gap-3">
                    {offers.slice(0, 4).map((brand) => (
                      <BrandTile key={brand.id} brand={brand} />
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
                <span className="text-muted-foreground">{t("home_trustLine")}</span>
              </div>
            </>
          )}
        </AsyncState>
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
