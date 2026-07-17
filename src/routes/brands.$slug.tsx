import { createFileRoute } from "@tanstack/react-router";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { ProductCard } from "@/components/shell/Cards";
import { findBrand, products } from "@/data/catalog";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/brands/$slug")({
  component: BrandPage,
});

function BrandPage() {
  const { slug } = Route.useParams();
  const brand = findBrand(slug);
  const { t } = useI18n();
  const list = products.filter((p) => p.brandId === slug);

  return (
    <MobileScreen>
      <TopBar title={brand?.name ?? slug} showBack />
      <ScreenBody>
        {brand && (
          <div
            className="relative mb-4 overflow-hidden rounded-3xl p-5 text-white shadow-elevated"
            style={{ background: `linear-gradient(135deg, ${brand.color}, ${brand.color}bb)` }}
          >
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-3xl font-black backdrop-blur">
              {brand.logo || brand.name.slice(0, 1)}
            </div>
            <div className="mt-3 font-display text-2xl font-black">{brand.name}</div>
            <p className="mt-1 text-sm text-white/80">
              {list.length} products · Instant delivery
            </p>
          </div>
        )}
        {list.length ? (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => <ProductCard key={p.id} product={p} size="md" />)}
          </div>
        ) : (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            {t("empty_search")}
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
