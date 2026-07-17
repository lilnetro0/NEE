import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Shared layout for operational status screens (fulfillment pending, failed,
 * partial, refund pending, maintenance, mandatory update, supplier outage,
 * product unavailable, price changed, etc.).
 */
export function StatusScreen({
  title,
  message,
  icon,
  tone = "neutral",
  primary,
  secondary,
  showBack = true,
}: {
  title: string;
  message: string;
  icon: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  primary?: { label: string; to?: string; onClick?: () => void };
  secondary?: { label: string; to?: string; onClick?: () => void };
  showBack?: boolean;
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/15 text-success"
      : tone === "warning"
      ? "bg-warning/15 text-warning"
      : tone === "danger"
      ? "bg-destructive/15 text-destructive"
      : "bg-secondary text-foreground";
  const { t } = useI18n();
  void t;
  return (
    <MobileScreen>
      <TopBar title="" showBack={showBack} showCart={false} />
      <ScreenBody>
        <div className="mx-auto flex max-w-sm flex-col items-center pt-8 text-center">
          <div className={`grid h-20 w-20 place-items-center rounded-3xl ${toneClass}`}>
            {icon}
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>

          <div className="mt-8 w-full space-y-2">
            {primary && (
              primary.to ? (
                <Link
                  to={primary.to}
                  className="block w-full rounded-full gradient-brand py-3 text-sm font-bold text-brand-foreground"
                >
                  {primary.label}
                </Link>
              ) : (
                <button
                  onClick={primary.onClick}
                  className="w-full rounded-full gradient-brand py-3 text-sm font-bold text-brand-foreground"
                >
                  {primary.label}
                </button>
              )
            )}
            {secondary && (
              secondary.to ? (
                <Link
                  to={secondary.to}
                  className="block w-full rounded-full border border-border py-3 text-sm font-semibold"
                >
                  {secondary.label}
                </Link>
              ) : (
                <button
                  onClick={secondary.onClick}
                  className="w-full rounded-full border border-border py-3 text-sm font-semibold"
                >
                  {secondary.label}
                </button>
              )
            )}
          </div>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
