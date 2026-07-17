import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { ProductCard } from "@/components/shell/Cards";
import { useCategory, useProducts } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryPage,
});

type Sort = "popular" | "newest" | "price-asc" | "price-desc" | "discount";

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: cat } = useCategory(slug);
  const { data: products = [] } = useProducts({ categoryId: slug });
  const { t, locale } = useI18n();
  const [sort, setSort] = useState<Sort>("popular");
  const [sortOpen, setSortOpen] = useState(false);

  const list = [...products].sort((a, b) => {
    if (sort === "price-asc") return a.fromPrice - b.fromPrice;
    if (sort === "price-desc") return b.fromPrice - a.fromPrice;
    if (sort === "discount") {
      const da = a.compareAt ? (a.compareAt - a.fromPrice) / a.compareAt : 0;
      const db = b.compareAt ? (b.compareAt - b.fromPrice) / b.compareAt : 0;
      return db - da;
    }
    return 0;
  });

  return (
    <MobileScreen>
      <TopBar title={cat ? cat.name[locale] : slug} showBack />
      <ScreenBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{list.length} products</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs font-semibold"
            >
              <ArrowUpDown className="h-3.5 w-3.5" /> {t("sort")}
            </button>
            <button className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs font-semibold">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {t("filter")}
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            No products in this category yet.
            <div className="mt-4">
              <Link to="/categories" className="font-semibold text-brand">
                Browse all
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} size="md" />
            ))}
          </div>
        )}

        {sortOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/60"
            onClick={() => setSortOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="pb-safe w-full rounded-t-3xl bg-card p-4 pb-8"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <h3 className="mb-3 font-display text-lg font-bold">{t("sort")}</h3>
              {(
                [
                  ["popular", "Most Popular"],
                  ["newest", "Newest"],
                  ["price-asc", "Price: Low to High"],
                  ["price-desc", "Price: High to Low"],
                  ["discount", "Highest Discount"],
                ] as [Sort, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => {
                    setSort(k);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-4 text-sm",
                    sort === k ? "bg-brand/10 text-brand" : "text-foreground",
                  )}
                >
                  {label}
                  {sort === k && <span className="h-2 w-2 rounded-full bg-brand" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
