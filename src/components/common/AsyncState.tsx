import type { ReactNode } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type Props<T> = {
  status: "loading" | "error" | "empty" | "ready";
  data?: T;
  error?: Error | string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  /** Content-shaped placeholder shown while loading instead of the spinner. */
  skeleton?: ReactNode;
  emptyLabel?: string;
  emptyIcon?: ReactNode;
  /** Optional call-to-action rendered under the empty state. */
  emptyAction?: ReactNode;
  children: (data: T) => ReactNode;
};

/**
 * Standard loading / empty / error / retry wrapper for data-dependent screens.
 * Callers pass `status` explicitly; this component owns the visuals only.
 */
export function AsyncState<T>({
  status,
  data,
  error,
  onRetry,
  loadingLabel,
  skeleton,
  emptyLabel,
  emptyIcon,
  emptyAction,
  children,
}: Props<T>) {
  const { t } = useI18n();

  if (status === "loading") {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <p className="text-sm">{loadingLabel ?? t("loading")}</p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
        <p className="text-sm text-muted-foreground">
          {typeof error === "string" ? error : (error?.message ?? t("error_genericTitle"))}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 rounded-full bg-secondary px-5 py-2 text-sm font-semibold"
          >
            {t("retry")}
          </button>
        )}
      </div>
    );
  }
  if (status === "empty") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        {emptyIcon ?? <Inbox className="h-8 w-8" aria-hidden />}
        <p className="text-sm">{emptyLabel ?? t("empty_generic")}</p>
        {emptyAction}
      </div>
    );
  }
  return <>{data !== undefined ? children(data) : null}</>;
}
