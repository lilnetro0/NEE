import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Check } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/appearance")({
  component: Appearance,
});

function Appearance() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const opts: { id: "dark" | "light"; label: string; icon: typeof Moon }[] = [
    { id: "dark", label: t("dark"), icon: Moon },
    { id: "light", label: t("light"), icon: Sun },
  ];
  return (
    <MobileScreen>
      <TopBar title={t("appearance")} showBack showCart={false} />
      <ScreenBody className="grid grid-cols-2 gap-3">
        {opts.map((o) => {
          const Icon = o.icon;
          const active = theme === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              className={cn(
                "relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl border-2 p-4",
                active ? "border-brand" : "border-input",
              )}
              style={{ background: o.id === "dark" ? "#12141f" : "#f8fafc" }}
            >
              <Icon className={cn("h-6 w-6", o.id === "dark" ? "text-brand-glow" : "text-brand")} />
              <div
                className={cn(
                  "font-display text-lg font-bold",
                  o.id === "dark" ? "text-white" : "text-slate-900",
                )}
              >
                {o.label}
              </div>
              {active && (
                <Check className="absolute right-3 top-3 h-5 w-5 rounded-full bg-brand p-1 text-brand-foreground" />
              )}
            </button>
          );
        })}
      </ScreenBody>
    </MobileScreen>
  );
}
