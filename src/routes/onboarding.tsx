import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Gift, Zap, ShieldCheck, Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { t, locale, setLocale } = useI18n();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  const slides = [
    { icon: Gift, title: t("ob1_t"), desc: t("ob1_d"), color: "from-brand to-cyan" },
    { icon: Zap, title: t("ob2_t"), desc: t("ob2_d"), color: "from-cyan to-violet" },
    { icon: ShieldCheck, title: t("ob3_t"), desc: t("ob3_d"), color: "from-violet to-brand" },
  ];

  const finish = () => {
    try { localStorage.setItem("netro:onboarded", "1"); } catch {}
    nav({ to: "/auth/login" });
  };

  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="pt-safe flex min-h-[100dvh] flex-col bg-background px-6">
      <div className="flex items-center justify-between py-3">
        <button
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs font-semibold"
        >
          <Globe className="h-4 w-4" />
          {locale === "en" ? "العربية" : "English"}
        </button>
        <button onClick={finish} className="text-sm font-semibold text-muted-foreground">
          {t("skip")}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className={cn("mb-10 grid h-40 w-40 place-items-center rounded-[40px] bg-gradient-to-br text-white shadow-elevated", slide.color)}>
          <Icon className="h-20 w-20" strokeWidth={1.6} />
        </div>
        <h1 className="font-display text-3xl font-black leading-tight">{slide.title}</h1>
        <p className="mt-3 max-w-xs text-base text-muted-foreground">{slide.desc}</p>
      </div>

      <div className="pb-safe space-y-6 pb-6">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "w-8 bg-brand" : "w-2 bg-muted",
              )}
            />
          ))}
        </div>
        <button
          onClick={() => (step < slides.length - 1 ? setStep(step + 1) : finish())}
          className="h-14 w-full rounded-full gradient-brand text-base font-bold text-brand-foreground shadow-elevated active:scale-[0.98]"
        >
          {step < slides.length - 1 ? t("next") : t("getStarted")}
        </button>
      </div>
    </div>
  );
}
