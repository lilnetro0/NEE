import type { ReactNode } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type Props<T> = {
  status: "loading" | "error" | "empty" | "ready";
  data?: T;
  error?: Error | string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  emptyLabel?: string;
  emptyIcon?: ReactNode;
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
  emptyLabel,
  emptyIcon,
  children,
}: Props<T>) {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";

  if (status === "loading") {
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
          {typeof error === "string"
            ? error
            : error?.message ?? (isAr ? "حدث خطأ ما" : "Something went wrong")}
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
        <p className="text-sm">{emptyLabel ?? (isAr ? "لا يوجد شيء هنا بعد" : "Nothing here yet")}</p>
      </div>
    );
  }
  return <>{data !== undefined ? children(data) : null}</>;
}

