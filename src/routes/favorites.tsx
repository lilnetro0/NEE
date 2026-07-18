import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody, BottomNav } from "@/components/shell/Shell";
import { BrandCard } from "@/components/shell/Cards";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import { useStore } from "@/store/StoreProvider";
import { useBrands, useProducts } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
});

function Favorites() {
  const { favorites } = useStore();
  const { t } = useI18n();
  const { data: products = [], status } = useProducts(
    favorites.length ? { ids: favorites } : undefined,
  );
  const { data: brands = [] } = useBrands();
  const favoriteBrandIds = new Set(products.map((product) => product.brandId));
  const list = favorites.length ? brands.filter((brand) => favoriteBrandIds.has(brand.id)) : [];
  return (
    <MobileScreen>
      <TopBar title={t("favorites")} showBack />
      <ScreenBody>
        {favorites.length > 0 && status === "loading" ? (
          <ProductGridSkeleton />
        ) : list.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface">
              <Heart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t("empty_favorites")}</p>
            <Link
              to="/home"
              className="mt-4 inline-flex min-h-11 items-center rounded-full gradient-brand px-6 text-sm font-semibold text-brand-foreground active:scale-[0.97]"
            >
              {t("browseNow")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
