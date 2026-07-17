import type { ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import type { AppError } from "@/data-access/result";

type Action = {
  label: string;
  onClick: () => void;
};

type StateProps = {
  title: string;
  message: string;
  referenceId?: string;
  actions?: Action[];
  children?: ReactNode;
};

function StateFrame({ title, message, referenceId, actions, children }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {referenceId ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground" dir="ltr">
          {referenceId}
        </p>
      ) : null}
      {children}
      {actions && actions.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ApiErrorState({
  error,
  onRetry,
  referenceId,
}: {
  error?: AppError | null;
  onRetry?: () => void;
  referenceId?: string;
}) {
  const { t } = useI18n();
  const retryable =
    !error ||
    error.code === "network" ||
    error.code === "unavailable" ||
    error.code === "rate_limited";

  return (
    <StateFrame
      title={t("error_apiTitle")}
      message={t("error_apiBody")}
      referenceId={referenceId}
      actions={retryable && onRetry ? [{ label: t("retry"), onClick: onRetry }] : undefined}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <StateFrame
      title={t("error_offlineTitle")}
      message={t("error_offlineBody")}
      actions={onRetry ? [{ label: t("retry"), onClick: onRetry }] : undefined}
    />
  );
}

export function MaintenanceState() {
  const { t } = useI18n();
  return <StateFrame title={t("error_maintenanceTitle")} message={t("error_maintenanceBody")} />;
}

export function MandatoryUpdateState({ onUpdate }: { onUpdate?: () => void }) {
  const { t } = useI18n();
  return (
    <StateFrame
      title={t("error_updateTitle")}
      message={t("error_updateBody")}
      actions={onUpdate ? [{ label: t("op_action_updateNow"), onClick: onUpdate }] : undefined}
    />
  );
}

/** Map API error codes to localized user-facing copy (never raw backend text). */
export function localizedApiErrorMessage(error: AppError, t: (key: string) => string): string {
  switch (error.code) {
    case "network":
      return t("error_offlineBody");
    case "unauthorized":
      return t("auth_sessionExpired");
    case "rate_limited":
      return t("auth_rateLimited");
    case "validation":
      return t("error_validationBody");
    case "not_found":
      return t("error_notFoundBody");
    case "conflict":
      return t("error_conflictBody");
    case "unavailable":
      return t("error_unavailableBody");
    default:
      return t("error_apiBody");
  }
}
