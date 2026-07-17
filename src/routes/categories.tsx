import { createFileRoute } from "@tanstack/react-router";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { BrandTile, CategoryTile, HScroll } from "@/components/shell/Cards";
import { useBrands, useCategories } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/categories")({
  component: Categories,
});

function Categories() {
  const { t } = useI18n();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  return (
    <MobileScreen>
      <TopBar title={t("browseCategories")} />
      <ScreenBody>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <CategoryTile key={c.id} cat={c} />
          ))}
        </div>
        <h2 className="mb-3 mt-8 font-display text-lg font-bold">{t("brands")}</h2>
        <HScroll>
          {brands.map((b) => (
            <BrandTile key={b.id} brand={b} />
          ))}
        </HScroll>
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
