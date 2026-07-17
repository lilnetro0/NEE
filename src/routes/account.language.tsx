import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/language")({
  component: Language,
});

function Language() {
  const { t, locale, setLocale } = useI18n();
  const opts: { id: "en" | "ar"; label: string; sub: string; flag: string }[] = [
    { id: "en", label: "English", sub: "English", flag: "🇬🇧" },
    { id: "ar", label: "العربية", sub: "Arabic (RTL)", flag: "🇸🇦" },
  ];
  return (
    <MobileScreen>
      <TopBar title={t("language")} showBack showCart={false} />
      <ScreenBody className="space-y-2">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => setLocale(o.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border-2 p-4",
              locale === o.id ? "border-brand bg-brand/10" : "border-input bg-card",
            )}
          >
            <span className="text-2xl">{o.flag}</span>
            <div className="flex-1 text-left">
              <div className="font-display text-lg font-bold">{o.label}</div>
              <div className="text-xs text-muted-foreground">{o.sub}</div>
            </div>
            {locale === o.id && <Check className="h-5 w-5 text-brand" />}
          </button>
        ))}
      </ScreenBody>
    </MobileScreen>
  );
}
