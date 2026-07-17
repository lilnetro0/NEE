import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, type Locale, type TranslationKey } from "./dictionaries";
import { usePlatform } from "@/platform/PlatformProvider";

type Ctx = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (k: TranslationKey) => string;
  formatPrice: (n: number, currency?: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "netro:locale";

function useHydratedLocale(): [Locale, (l: Locale) => void] {
  const { preferences } = usePlatform();
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    let active = true;
    void preferences.get(STORAGE_KEY).then((stored) => {
      if (active && (stored === "en" || stored === "ar")) setLocaleState(stored);
    });
    return () => {
      active = false;
    };
  }, [preferences]);
  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      void preferences.set(STORAGE_KEY, l);
    },
    [preferences],
  );
  return [locale, setLocale];
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useHydratedLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", dir);
  }, [locale, dir]);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      dir,
      setLocale,
      t: (k) => dictionaries[locale][k] ?? dictionaries.en[k] ?? String(k),
      formatPrice: (n, currency) => {
        const cur = currency ?? (locale === "ar" ? "ر.س" : "SAR");
        try {
          const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          return locale === "ar" ? `${nf.format(n)} ${cur}` : `${cur} ${nf.format(n)}`;
        } catch {
          return `${cur} ${n.toFixed(2)}`;
        }
      },
    }),
    [locale, dir, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
