import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search as SearchIcon, X, TrendingUp, Clock } from "lucide-react";
import { MobileScreen, ScreenBody, TopBar, BottomNav } from "@/components/shell/Shell";
import { ProductCard } from "@/components/shell/Cards";
import { products } from "@/data/catalog";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/search")({
  component: Search,
});

const trending = ["PUBG UC", "PSN 100", "Steam Wallet", "Netflix", "Free Fire", "Roblox"];

function Search() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const r = localStorage.getItem("netro:recent-search");
      if (r) setRecent(JSON.parse(r));
    } catch {}
  }, []);

  const save = (term: string) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter((x) => x !== term)].slice(0, 6);
      try { localStorage.setItem("netro:recent-search", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const results = q
    ? products.filter((p) =>
        p.title.en.toLowerCase().includes(q.toLowerCase()) ||
        p.title.ar.includes(q) ||
        p.brandId.includes(q.toLowerCase()),
      )
    : [];

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
              <button onClick={() => setQ("")} aria-label="Clear">
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
                  <h3 className="text-sm font-semibold text-muted-foreground">Recent</h3>
                  <button onClick={() => { setRecent([]); localStorage.removeItem("netro:recent-search"); }} className="text-xs text-brand">
                    {t("clear")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button key={r} onClick={() => setQ(r)} className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" /> {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Trending
            </h3>
            <div className="flex flex-wrap gap-2">
              {trending.map((r) => (
                <button key={r} onClick={() => setQ(r)} className="rounded-full bg-surface px-3 py-2 text-xs font-medium">
                  {r}
                </button>
              ))}
            </div>
            <h3 className="mb-3 mt-6 font-display text-lg font-bold">Popular</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} size="md" />)}
            </div>
          </>
        ) : results.length ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground">{results.length} results</p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((p) => <ProductCard key={p.id} product={p} size="md" />)}
            </div>
          </>
        ) : (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface">
              <SearchIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("empty_search")}</p>
          </div>
        )}
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
