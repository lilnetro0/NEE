import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";

type Action = { label: string; to?: string; onClick?: () => void };

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
  tertiary,
  showBack = true,
}: {
  title: string;
  message: string;
  icon: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  primary?: Action;
  secondary?: Action;
  tertiary?: Action;
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
  const { t, dir } = useI18n();
  void t;

  const renderAction = (action: Action, variant: "primary" | "secondary" | "tertiary") => {
    const className =
      variant === "primary"
        ? "block w-full rounded-full gradient-brand py-3 text-sm font-bold text-brand-foreground"
        : variant === "secondary"
          ? "block w-full rounded-full border border-border py-3 text-sm font-semibold"
          : "block w-full py-3 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline";

    if (action.to) {
      return (
        <Link key={action.label} to={action.to as never} className={className}>
          {action.label}
        </Link>
      );
    }
    return (
      <button key={action.label} type="button" onClick={action.onClick} className={className}>
        {action.label}
      </button>
    );
  };

  return (
    <MobileScreen>
      <TopBar title="" showBack={showBack} showCart={false} />
      <ScreenBody>
        <div className="mx-auto flex max-w-sm flex-col items-center pt-8 text-center" dir={dir}>
          <div className={`grid h-20 w-20 place-items-center rounded-3xl ${toneClass}`}>{icon}</div>
          <h1 className="mt-6 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>

          <div className="mt-8 w-full space-y-2">
            {primary && renderAction(primary, "primary")}
            {secondary && renderAction(secondary, "secondary")}
            {tertiary && renderAction(tertiary, "tertiary")}
          </div>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
