import { createFileRoute } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody, BottomNav } from "@/components/shell/Shell";
import { ProductCard } from "@/components/shell/Cards";
import { useStore } from "@/store/StoreProvider";
import { useProducts } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
});

function Favorites() {
  const { favorites } = useStore();
  const { t } = useI18n();
  const { data: products = [] } = useProducts(
    favorites.length ? { ids: favorites } : undefined,
  );
  const list = favorites.length ? products : [];
  return (
    <MobileScreen>
      <TopBar title={t("favorites")} showBack />
      <ScreenBody>
        {list.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface">
              <Heart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t("empty_favorites")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} size="md" />
            ))}
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
