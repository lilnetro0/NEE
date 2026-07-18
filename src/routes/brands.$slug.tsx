import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Globe2 } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import { useBrand, useBrandRegions } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/brands/$slug")({
  component: BrandPage,
});

function BrandPage() {
  const { slug } = Route.useParams();
  const { data: brand } = useBrand(slug);
  const { data: regions = [], status: regionsStatus } = useBrandRegions(brand?.id ?? "__pending__");
  const { t, locale } = useI18n();

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
              {regions.length} {t("availableRegions")} · {t("instantDelivery")}
            </p>
          </div>
        )}
        <h2 className="mb-3 font-display text-lg font-bold">{t("selectRegion")}</h2>
        {regionsStatus === "loading" ? (
          <ProductGridSkeleton />
        ) : regions.length ? (
          <div className="space-y-3">
            {regions.map((region) => (
              <Link
                key={region.code}
                to="/brands/$slug/$region"
                params={{
                  slug: brand?.slug ?? brand?.id ?? slug,
                  region: region.code.toLowerCase(),
                }}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card active:scale-[0.98]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Globe2 className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{region.name[locale]}</span>
                  <span className="block text-xs text-muted-foreground">{region.code}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
            {t("noRegions")}
            <Link
              to="/categories"
              className="inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-foreground active:scale-[0.97]"
            >
              {t("browseAll")}
            </Link>
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
