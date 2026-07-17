import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CloudOff,
  CreditCard,
  Download,
  Loader2,
  PackageCheck,
  PackageX,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  Undo2,
  WifiOff,
  Wrench,
  XCircle,
} from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import {
  OPERATIONAL_STATUSES,
  type OperationalActionKind,
  type OperationalStatusId,
} from "@/domain/operational-status";
import { useI18n } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/dictionaries";
import { usePlatform } from "@/platform/PlatformProvider";

const TITLE_KEY: Record<OperationalStatusId, TranslationKey> = {
  product_unavailable: "op_productUnavailable_title",
  price_changed: "op_priceChanged_title",
  payment_pending: "op_paymentPending_title",
  payment_failed: "op_paymentFailed_title",
  payment_cancelled: "op_paymentCancelled_title",
  payment_redirect_return: "op_paymentReturn_title",
  fulfillment_pending: "op_fulfillmentPending_title",
  fulfillment_failed: "op_fulfillmentFailed_title",
  partial_fulfillment: "op_partialFulfillment_title",
  manual_review: "op_manualReview_title",
  refund_requested: "op_refundRequested_title",
  refund_processing: "op_refundProcessing_title",
  refund_completed: "op_refundCompleted_title",
  service_temporarily_unavailable: "op_serviceUnavailable_title",
  offline: "op_offline_title",
  maintenance: "op_maintenance_title",
  update_required: "op_updateRequired_title",
  api_error: "op_apiError_title",
};

const MESSAGE_KEY: Record<OperationalStatusId, TranslationKey> = {
  product_unavailable: "op_productUnavailable_message",
  price_changed: "op_priceChanged_message",
  payment_pending: "op_paymentPending_message",
  payment_failed: "op_paymentFailed_message",
  payment_cancelled: "op_paymentCancelled_message",
  payment_redirect_return: "op_paymentReturn_message",
  fulfillment_pending: "op_fulfillmentPending_message",
  fulfillment_failed: "op_fulfillmentFailed_message",
  partial_fulfillment: "op_partialFulfillment_message",
  manual_review: "op_manualReview_message",
  refund_requested: "op_refundRequested_message",
  refund_processing: "op_refundProcessing_message",
  refund_completed: "op_refundCompleted_message",
  service_temporarily_unavailable: "op_serviceUnavailable_message",
  offline: "op_offline_message",
  maintenance: "op_maintenance_message",
  update_required: "op_updateRequired_message",
  api_error: "op_apiError_message",
};

const ACTION_LABEL: Record<OperationalActionKind, TranslationKey> = {
  retry: "retry",
  browse: "browseNow",
  review_cart: "op_action_reviewCart",
  checkout: "checkout",
  view_order: "viewOrder",
  view_orders: "nav_orders",
  contact_support: "contactSupport",
  return_home: "returnHome",
  update_app: "op_action_updateNow",
  continue_shopping: "continueShopping",
};

function statusIcon(id: OperationalStatusId): ReactNode {
  const cls = "h-10 w-10";
  switch (id) {
    case "product_unavailable":
      return <PackageX className={cls} />;
    case "price_changed":
      return <TrendingUp className={cls} />;
    case "payment_pending":
    case "payment_redirect_return":
      return <Loader2 className={`${cls} animate-spin`} />;
    case "payment_failed":
      return <XCircle className={cls} />;
    case "payment_cancelled":
      return <CreditCard className={cls} />;
    case "fulfillment_pending":
      return <Loader2 className={`${cls} animate-spin`} />;
    case "fulfillment_failed":
      return <XCircle className={cls} />;
    case "partial_fulfillment":
      return <AlertTriangle className={cls} />;
    case "manual_review":
      return <ShieldAlert className={cls} />;
    case "refund_requested":
    case "refund_processing":
      return <Undo2 className={cls} />;
    case "refund_completed":
      return <PackageCheck className={cls} />;
    case "service_temporarily_unavailable":
      return <CloudOff className={cls} />;
    case "offline":
      return <WifiOff className={cls} />;
    case "maintenance":
      return <Wrench className={cls} />;
    case "update_required":
      return <Download className={cls} />;
    case "api_error":
      return <AlertCircle className={cls} />;
    default:
      return <RotateCcw className={cls} />;
  }
}

function resolveActionTo(kind: OperationalActionKind, orderId?: string): string | undefined {
  switch (kind) {
    case "browse":
    case "return_home":
    case "continue_shopping":
      return "/home";
    case "review_cart":
      return "/cart";
    case "checkout":
    case "retry":
      return "/checkout";
    case "view_orders":
      return "/orders";
    case "view_order":
      return orderId ? `/order/${orderId}` : "/orders";
    case "contact_support":
      return "/support/new";
    case "update_app":
      return undefined;
    default:
      return undefined;
  }
}

export type OperationalStatusScreenProps = {
  statusId: OperationalStatusId;
  /** When set, “View order” deep-links to this order. */
  orderId?: string;
  /** Override retry (offline / API error / maintenance). */
  onRetry?: () => void;
  showBack?: boolean;
};

/**
 * Renders a localized operational state via the shared StatusScreen.
 * Copy is dictionary-driven for EN/AR; layout inherits document RTL.
 */
export function OperationalStatusScreen({
  statusId,
  orderId,
  onRetry,
  showBack,
}: OperationalStatusScreenProps) {
  const { t } = useI18n();
  const { externalUrls } = usePlatform();
  const def = OPERATIONAL_STATUSES[statusId];

  const buildAction = (kind: OperationalActionKind | undefined) => {
    if (!kind) return undefined;
    const label = t(ACTION_LABEL[kind]);

    if (kind === "update_app") {
      return {
        label,
        onClick: () => void externalUrls.open("https://apps.apple.com"),
      };
    }

    if (kind === "retry" && onRetry) {
      return { label, onClick: onRetry };
    }

    // Offline / API / maintenance retry without handler → soft reload
    if (
      kind === "retry" &&
      (statusId === "offline" ||
        statusId === "api_error" ||
        statusId === "maintenance" ||
        statusId === "service_temporarily_unavailable")
    ) {
      return {
        label,
        onClick: () => {
          if (typeof window !== "undefined") window.location.reload();
        },
      };
    }

    return { label, to: resolveActionTo(kind, orderId) };
  };

  return (
    <StatusScreen
      showBack={showBack ?? def.showBack}
      tone={def.tone}
      icon={statusIcon(statusId)}
      title={t(TITLE_KEY[statusId])}
      message={t(MESSAGE_KEY[statusId])}
      primary={buildAction(def.primary)}
      secondary={buildAction(def.secondary)}
      tertiary={buildAction(def.tertiary)}
    />
  );
}
