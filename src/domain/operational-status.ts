/**
 * Operational UI states required before backend integration.
 * Customer-facing copy must never expose supplier names or internal refs.
 */

export type OperationalStatusId =
  | "product_unavailable"
  | "price_changed"
  | "payment_pending"
  | "payment_failed"
  | "payment_cancelled"
  | "payment_redirect_return"
  | "fulfillment_pending"
  | "fulfillment_failed"
  | "partial_fulfillment"
  | "manual_review"
  | "refund_requested"
  | "refund_processing"
  | "refund_completed"
  | "service_temporarily_unavailable"
  | "offline"
  | "maintenance"
  | "update_required"
  | "api_error";

export type OperationalTone = "neutral" | "success" | "warning" | "danger";

export type OperationalActionKind =
  | "retry"
  | "browse"
  | "review_cart"
  | "checkout"
  | "view_order"
  | "view_orders"
  | "contact_support"
  | "return_home"
  | "update_app"
  | "continue_shopping";

export type OperationalStatusDef = {
  id: OperationalStatusId;
  /** URL path under /status/… */
  path: string;
  tone: OperationalTone;
  /** Hide back when the user must stay on this gate. */
  showBack: boolean;
  primary: OperationalActionKind;
  secondary?: OperationalActionKind;
  tertiary?: OperationalActionKind;
};

export const OPERATIONAL_STATUSES: Record<OperationalStatusId, OperationalStatusDef> = {
  product_unavailable: {
    id: "product_unavailable",
    path: "/status/product-unavailable",
    tone: "warning",
    showBack: true,
    primary: "browse",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  price_changed: {
    id: "price_changed",
    path: "/status/price-changed",
    tone: "warning",
    showBack: true,
    primary: "review_cart",
    secondary: "checkout",
    tertiary: "return_home",
  },
  payment_pending: {
    id: "payment_pending",
    path: "/status/payment-pending",
    tone: "neutral",
    showBack: true,
    primary: "view_orders",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  payment_failed: {
    id: "payment_failed",
    path: "/status/payment-failed",
    tone: "danger",
    showBack: true,
    primary: "retry",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  payment_cancelled: {
    id: "payment_cancelled",
    path: "/status/payment-cancelled",
    tone: "neutral",
    showBack: true,
    primary: "checkout",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  payment_redirect_return: {
    id: "payment_redirect_return",
    path: "/status/payment-return",
    tone: "neutral",
    showBack: false,
    primary: "view_orders",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  fulfillment_pending: {
    id: "fulfillment_pending",
    path: "/status/fulfillment-pending",
    tone: "neutral",
    showBack: true,
    primary: "view_order",
    secondary: "view_orders",
    tertiary: "return_home",
  },
  fulfillment_failed: {
    id: "fulfillment_failed",
    path: "/status/fulfillment-failed",
    tone: "danger",
    showBack: true,
    primary: "retry",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  partial_fulfillment: {
    id: "partial_fulfillment",
    path: "/status/partial-fulfillment",
    tone: "warning",
    showBack: true,
    primary: "view_order",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  manual_review: {
    id: "manual_review",
    path: "/status/manual-review",
    tone: "warning",
    showBack: true,
    primary: "view_order",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  refund_requested: {
    id: "refund_requested",
    path: "/status/refund-requested",
    tone: "neutral",
    showBack: true,
    primary: "view_order",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  refund_processing: {
    id: "refund_processing",
    path: "/status/refund-processing",
    tone: "neutral",
    showBack: true,
    primary: "view_order",
    secondary: "contact_support",
    tertiary: "return_home",
  },
  refund_completed: {
    id: "refund_completed",
    path: "/status/refund-completed",
    tone: "success",
    showBack: true,
    primary: "view_order",
    secondary: "continue_shopping",
    tertiary: "return_home",
  },
  service_temporarily_unavailable: {
    id: "service_temporarily_unavailable",
    path: "/status/supplier-outage",
    tone: "warning",
    showBack: true,
    primary: "retry",
    secondary: "browse",
    tertiary: "return_home",
  },
  offline: {
    id: "offline",
    path: "/status/offline",
    tone: "warning",
    showBack: true,
    primary: "retry",
    secondary: "return_home",
  },
  maintenance: {
    id: "maintenance",
    path: "/status/maintenance",
    tone: "warning",
    showBack: false,
    primary: "retry",
    secondary: "return_home",
  },
  update_required: {
    id: "update_required",
    path: "/status/update-required",
    tone: "warning",
    showBack: false,
    primary: "update_app",
  },
  api_error: {
    id: "api_error",
    path: "/status/api-error",
    tone: "danger",
    showBack: true,
    primary: "retry",
    secondary: "contact_support",
    tertiary: "return_home",
  },
};

export const OPERATIONAL_STATUS_LIST = Object.values(OPERATIONAL_STATUSES);
