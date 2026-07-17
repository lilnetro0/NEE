import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Sparkles } from "lucide-react";
import { MobileScreen } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/order/$id/success")({
  component: Success,
});

function Success() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  return (
    <MobileScreen>
      <div className="pt-safe flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-brand/30 blur-3xl" />
          <div className="grid h-24 w-24 place-items-center rounded-full gradient-brand shadow-elevated">
            <CheckCircle2 className="h-12 w-12 text-brand-foreground" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="mt-8 font-display text-3xl font-black">{t("orderPlaced")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("thankYou")}</p>
        <div className="mt-6 rounded-2xl bg-surface px-6 py-3 text-sm">
          <span className="text-muted-foreground">{t("orderNo")}: </span>
          <span className="font-mono font-bold">{id}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4 text-brand" /> Delivery in your inbox in seconds
        </div>
        <div className="pb-safe mt-12 flex w-full flex-col gap-3">
          <Link
            to="/order/$id"
            params={{ id }}
            className="h-14 rounded-full gradient-brand text-sm font-bold leading-[3.5rem] text-brand-foreground shadow-elevated"
          >
            {t("viewOrder")}
          </Link>
          <Link to="/home" className="h-14 rounded-full border border-input text-sm font-bold leading-[3.5rem] text-foreground">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </MobileScreen>
  );
}
