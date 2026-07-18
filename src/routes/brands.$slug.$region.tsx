import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Gamepad2, Gift, MapPin } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { ProductDetailSkeleton } from "@/components/common/Skeletons";
import { useBrand, useProducts } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/brands/$slug/$region")({
  component: BrandRegionPage,
});

function BrandRegionPage() {
  const { slug, region } = Route.useParams();
  const { data: brand } = useBrand(slug);
  const regionCode = region.toUpperCase();
  const { data: offerings = [], status } = useProducts({
    brandId: brand?.id ?? "__pending__",
    regionId: regionCode,
    summary: false,
  });
  const { t, locale, formatPrice } = useI18n();
  const regionName = offerings[0]?.region.name[locale] ?? regionCode;

  return (
    <MobileScreen>
      <TopBar title={brand?.localizedName?.[locale] ?? brand?.name ?? slug} showBack />
      <ScreenBody>
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs text-muted-foreground">{t("availableRegions")}</div>
            <div className="font-bold">{regionName}</div>
          </div>
        </div>

        <h1 className="mb-3 font-display text-xl font-black">{t("variants")}</h1>
        {status === "loading" ? (
          <ProductDetailSkeleton />
        ) : offerings.length ? (
          <div className="space-y-4">
            {offerings.map((product) => {
              const variants =
                product.kind === "gift_card"
                  ? product.denominations.map((variant) => ({
                      id: variant.id,
                      label: formatPrice(variant.faceValue, product.redemptionCurrency),
                      price: formatPrice(variant.price, product.displayCurrency),
                      inStock: variant.inStock,
                    }))
                  : product.packages.map((variant) => ({
                      id: variant.id,
                      label: variant.label,
                      price: formatPrice(variant.price, product.displayCurrency),
                      inStock: variant.inStock,
                    }));
              const target =
                product.kind === "direct_topup" ? "/product/$id/topup" : "/product/$id";

              return (
                <section key={product.id} className="rounded-3xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/10 text-brand">
                      {product.kind === "gift_card" ? (
                        <Gift className="h-5 w-5" />
                      ) : (
                        <Gamepad2 className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-1 font-bold">{product.title[locale]}</h2>
                      <p className="text-xs text-muted-foreground">
                        {product.kind === "gift_card" ? t("giftCards") : t("topUps")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {variants.map((variant) => (
                      <Link
                        key={variant.id}
                        to={target}
                        params={{ id: product.id }}
                        search={{ sku: variant.id }}
                        className="flex min-h-14 items-center justify-between gap-2 rounded-2xl bg-surface px-3 py-2 active:scale-[0.98]"
                        aria-disabled={!variant.inStock}
                      >
                        <span>
                          <span className="block text-sm font-bold">{variant.label}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {variant.price}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            {t("empty_category")}
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
