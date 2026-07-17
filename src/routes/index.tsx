import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { usePlatform } from "@/platform/PlatformProvider";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  const { t } = useI18n();
  const { preferences } = usePlatform();
  const [seen, setSeen] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void preferences.get("netro:onboarded").then((value) => {
      if (active) setSeen(value);
    });
    return () => {
      active = false;
    };
  }, [preferences]);

  useEffect(() => {
    if (seen === undefined) return;
    const t = setTimeout(() => {
      if (seen === "1") nav({ to: "/home" });
      else nav({ to: "/onboarding" });
    }, 1600);
    return () => clearTimeout(t);
  }, [nav, seen]);

  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(600px 400px at 50% 30%, oklch(0.72 0.19 240 / 0.35), transparent 60%), radial-gradient(500px 400px at 80% 90%, oklch(0.68 0.19 300 / 0.25), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-6">
        <div className="grid h-24 w-24 place-items-center rounded-[28px] gradient-brand text-4xl font-black text-brand-foreground shadow-elevated animate-in fade-in zoom-in duration-700">
          N
        </div>
        <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          <div className="font-display text-4xl font-black tracking-tight">NETRO</div>
          <div className="mt-1 text-sm text-muted-foreground">{t("tagline")}</div>
        </div>
        <div className="mt-8 flex gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
