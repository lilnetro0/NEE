import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search as SearchIcon, X, TrendingUp, Clock } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { BrandCard } from "@/components/shell/Cards";
import { useI18n } from "@/i18n/I18nProvider";
import { useBrands, useCategories, useRegions } from "@/data-access";
import { usePlatform } from "@/platform/PlatformProvider";
import { AsyncState } from "@/components/common/AsyncState";
import { ProductGridSkeleton } from "@/components/common/Skeletons";

export const Route = createFileRoute("/search")({
  component: Search,
});

const TRENDING = ["PUBG UC", "PSN 100", "Steam Wallet", "Netflix", "Free Fire", "Roblox"];

function Search() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [platform, setPlatform] = useState("");
  const [featured, setFeatured] = useState(false);
  const [popularOnly, setPopularOnly] = useState(false);
  const popularQuery = useBrands({ limit: 6 });
  const categoriesQuery = useCategories();
  const regionsQuery = useRegions();
  const hasFilters = Boolean(categoryId || regionId || platform || featured || popularOnly);
  const searchQuery = useBrands({
    q: debouncedQ.trim() || undefined,
    categoryId: categoryId || undefined,
    regionId: regionId || undefined,
    platform: platform || undefined,
    featured: featured || undefined,
    popular: popularOnly || undefined,
    limit: debouncedQ.trim() || hasFilters ? 48 : 0,
  });
  const { preferences } = usePlatform();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 280);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    let active = true;
    void preferences.get("netro:recent-search").then((value) => {
      if (!active || !value) return;
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setRecent(parsed.filter((item): item is string => typeof item === "string"));
        }
      } catch {
        // Ignore invalid legacy preferences.
      }
    });
    return () => {
      active = false;
    };
  }, [preferences]);

  const save = (term: string) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter((x) => x !== term)].slice(0, 6);
      void preferences.set("netro:recent-search", JSON.stringify(next));
      return next;
    });
  };

  const popular = popularQuery.data ?? [];
  const searchResults = debouncedQ.trim() ? (searchQuery.data ?? []) : [];
  const searching = Boolean(debouncedQ.trim() || hasFilters);
  const searchStatus = !searching
    ? popularQuery.status
    : q !== debouncedQ
      ? "loading"
      : searchQuery.status;

  return (
    <MobileScreen>
      <TopBar
        title={
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-input bg-surface px-3">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => q && save(q)}
              placeholder={t("search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label={t("clear")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        }
        showBack
        showCart={false}
        showNotif={false}
      />
      <ScreenBody>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <select
            className="h-11 rounded-2xl border border-input bg-surface px-3 text-xs"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-label={t("browseCategories")}
          >
            <option value="">
              {t("all")} · {t("browseCategories")}
            </option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name[locale]}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-surface px-3 text-xs"
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
            aria-label={t("region")}
          >
            <option value="">
              {t("all")} · {t("region")}
            </option>
            {(regionsQuery.data ?? []).map((region) => (
              <option key={region.code} value={region.code}>
                {region.name[locale]}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-input bg-surface px-3 text-xs"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            aria-label={t("platform")}
          >
            <option value="">
              {t("all")} · {t("platform")}
            </option>
            <option value="Mobile">{t("platformMobile")}</option>
            <option value="PlayStation">PlayStation</option>
            <option value="Xbox">Xbox</option>
            <option value="PC">{t("platformPc")}</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFeatured((value) => !value)}
              className={`min-h-11 flex-1 rounded-2xl px-2 text-xs font-semibold ${
                featured ? "bg-brand text-brand-foreground" : "bg-surface"
              }`}
              aria-pressed={featured}
            >
              {t("filterFeatured")}
            </button>
            <button
              type="button"
              onClick={() => setPopularOnly((value) => !value)}
              className={`min-h-11 flex-1 rounded-2xl px-2 text-xs font-semibold ${
                popularOnly ? "bg-brand text-brand-foreground" : "bg-surface"
              }`}
              aria-pressed={popularOnly}
            >
              {t("filterPopular")}
            </button>
          </div>
        </div>
        {!q && !hasFilters ? (
          <>
            {recent.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {t("search_recent")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setRecent([]);
                      void preferences.remove("netro:recent-search");
                    }}
                    className="text-xs text-brand"
                  >
                    {t("clear")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setQ(r)}
                      className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" /> {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> {t("search_trending")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQ(r)}
                  className="rounded-full bg-surface px-3 py-2 text-xs font-medium"
                >
                  {r}
                </button>
              ))}
            </div>
            <h3 className="mb-3 mt-6 font-display text-lg font-bold">{t("search_popular")}</h3>
            <AsyncState
              status={popularQuery.status === "empty" ? "ready" : popularQuery.status}
              data={popular}
              error={popularQuery.error?.message ?? null}
              onRetry={popularQuery.reload}
              skeleton={<ProductGridSkeleton count={4} />}
            >
              {(items) => (
                <div className="grid grid-cols-2 gap-3">
                  {items.slice(0, 6).map((p) => (
                    <BrandCard key={p.id} brand={p} />
                  ))}
                </div>
              )}
            </AsyncState>
          </>
        ) : (
          <AsyncState
            status={searchStatus === "empty" ? "empty" : searchStatus}
            data={searchResults}
            error={searchQuery.error?.message ?? null}
            onRetry={searchQuery.reload}
            emptyLabel={t("empty_search")}
            emptyIcon={
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface">
                <SearchIcon className="h-7 w-7 text-muted-foreground" />
              </div>
            }
            skeleton={<ProductGridSkeleton count={4} />}
          >
            {(items) => (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  {items.length} {t("search_results")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((p) => (
                    <BrandCard key={p.id} brand={p} />
                  ))}
                </div>
              </>
            )}
          </AsyncState>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
