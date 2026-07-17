import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search as SearchIcon, X, TrendingUp, Clock } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { ProductCard } from "@/components/shell/Cards";
import { useI18n } from "@/i18n/I18nProvider";
import { useProducts } from "@/data-access";
import { usePlatform } from "@/platform/PlatformProvider";
import { AsyncState } from "@/components/common/AsyncState";

export const Route = createFileRoute("/search")({
  component: Search,
});

const TRENDING = ["PUBG UC", "PSN 100", "Steam Wallet", "Netflix", "Free Fire", "Roblox"];

function Search() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const popularQuery = useProducts({ limit: 6, summary: true });
  const searchQuery = useProducts(
    debouncedQ.trim()
      ? { q: debouncedQ.trim(), limit: 48, summary: true }
      : { limit: 0, summary: true },
  );
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
  const searching = Boolean(debouncedQ.trim());
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
        {!q ? (
          <>
            {recent.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground">{t("search_recent")}</h3>
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
            >
              {(items) => (
                <div className="grid grid-cols-2 gap-3">
                  {items.slice(0, 6).map((p) => (
                    <ProductCard key={p.id} product={p} size="md" />
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
          >
            {(items) => (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  {items.length} {t("search_results")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} size="md" />
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
