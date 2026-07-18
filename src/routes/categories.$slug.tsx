import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { BrandCard } from "@/components/shell/Cards";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import { useBrands, useCategory } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: cat } = useCategory(slug);
  const { data: brands = [], status: brandsStatus } = useBrands({
    categoryId: cat?.id ?? "__pending__",
  });
  const { t, locale } = useI18n();

  return (
    <MobileScreen>
      <TopBar title={cat ? cat.name[locale] : slug} showBack />
      <ScreenBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {brands.length} {t("brandsCountSuffix")}
          </span>
        </div>

        {brandsStatus === "loading" ? (
          <ProductGridSkeleton />
        ) : brands.length === 0 ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            {t("empty_category")}
            <div className="mt-4">
              <Link
                to="/categories"
                className="inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-foreground active:scale-[0.97]"
              >
                {t("browseAll")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
