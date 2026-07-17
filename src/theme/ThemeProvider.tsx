import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePlatform } from "@/platform/PlatformProvider";

type Theme = "dark" | "light";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };

const ThemeContext = createContext<Ctx | null>(null);
const KEY = "netro:theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { preferences } = usePlatform();
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    let active = true;
    void preferences.get(KEY).then((stored) => {
      if (active && (stored === "dark" || stored === "light")) setThemeState(stored);
    });
    return () => {
      active = false;
    };
  }, [preferences]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      setTheme: (t) => {
        setThemeState(t);
        void preferences.set(KEY, t);
      },
      toggle: () =>
        setThemeState((prev) => {
          const next = prev === "dark" ? "light" : "dark";
          void preferences.set(KEY, next);
          return next;
        }),
    }),
    [preferences, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
