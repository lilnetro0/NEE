/**
 * Checkout state machine, order lifecycle and quote model.
 *
 * Payment success must never be treated as order completion. Display status is
 * always derived from payment + fulfillment + refund â€” never a single boolean.
 */

import type { CurrencyCode, IsoDateTime, Localized } from "./common";
import type { FieldValues } from "./forms";

// ============ Checkout / order lifecycle (user-facing) ============

/**
 * Explicit checkout & post-checkout lifecycle shown in the UI.
 * Distinct from raw payment/fulfillment/refund enums.
 */
export type CheckoutState =
  | "validating_order"
  | "awaiting_payment"
  | "payment_processing"
  | "payment_confirmed"
  | "fulfillment_processing"
  | "fulfilled"
  | "partially_fulfilled"
  | "fulfillment_failed"
  | "manual_review"
  | "refund_pending"
  | "refunded"
  | "cancelled";

/** Same vocabulary as CheckoutState â€” the status shown on orders list/details. */
export type OrderDisplayStatus = CheckoutState;

export const CHECKOUT_TERMINAL: CheckoutState[] = [
  "fulfilled",
  "partially_fulfilled",
  "fulfillment_failed",
  "refunded",
  "cancelled",
];

export const CHECKOUT_ERROR: CheckoutState[] = ["fulfillment_failed"];

// ============ Payment / fulfillment / refund machines ============

export type PaymentStatus =
  | "not_started"
  | "processing"
  | "authorized"
  | "captured"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type FulfillmentStatus =
  | "not_started"
  | "queued"
  | "processing"
  | "fulfilled"
  | "partially_fulfilled"
  | "failed"
  | "manual_review";

export type RefundStatus =
  "none" | "requested" | "reviewing" | "approved" | "rejected" | "processing" | "completed";

/**
 * Derive the user-facing lifecycle status from the three independent machines.
 * Pure function â€” safe to unit-test later without a framework.
 */
export function deriveOrderDisplayStatus(
  payment: PaymentStatus,
  fulfillment: FulfillmentStatus,
  refund: RefundStatus,
): OrderDisplayStatus {
  if (refund === "completed" || payment === "refunded") return "refunded";
  if (
    refund === "requested" ||
    refund === "reviewing" ||
    refund === "approved" ||
    refund === "processing" ||
    payment === "partially_refunded"
  ) {
    return "refund_pending";
  }

  if (payment === "cancelled" || payment === "failed") return "cancelled";
  if (payment === "not_started") return "awaiting_payment";
  if (payment === "processing") return "payment_processing";

  // authorized / captured
  if (fulfillment === "manual_review") return "manual_review";
  if (fulfillment === "failed") return "fulfillment_failed";
  if (fulfillment === "partially_fulfilled") return "partially_fulfilled";
  if (fulfillment === "fulfilled") return "fulfilled";

  if (fulfillment === "processing" || fulfillment === "queued") {
    return "fulfillment_processing";
  }

  // fulfillment not_started
  if (payment === "authorized" || payment === "captured") return "payment_confirmed";

  return "awaiting_payment";
}

/** Coarse filter buckets for the orders list. */
export type OrderListBucket = "processing" | "completed" | "failed" | "refunded" | "cancelled";

export function toOrderListBucket(status: OrderDisplayStatus): OrderListBucket {
  switch (status) {
    case "fulfilled":
      return "completed";
    case "fulfillment_failed":
      return "failed";
    case "refunded":
    case "refund_pending":
      return "refunded";
    case "cancelled":
      return "cancelled";
    default:
      return "processing";
  }
}

export function localizedOrderStatus(status: OrderDisplayStatus, locale: "en" | "ar"): string {
  const copy: Record<OrderDisplayStatus, Localized> = {
    validating_order: { en: "Validating order", ar: "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø·Ù„Ø¨" },
    awaiting_payment: { en: "Awaiting payment", ar: "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø¯ÙØ¹" },
    payment_processing: { en: "Payment processing", ar: "Ø¬Ø§Ø±ÙŠ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø¯ÙØ¹" },
    payment_confirmed: { en: "Payment confirmed", ar: "ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¯ÙØ¹" },
    fulfillment_processing: { en: "Fulfillment processing", ar: "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªÙ†ÙÙŠØ°" },
    fulfilled: { en: "Fulfilled", ar: "ØªÙ… Ø§Ù„ØªØ³Ù„ÙŠÙ…" },
    partially_fulfilled: { en: "Partially fulfilled", ar: "ØªØ³Ù„ÙŠÙ… Ø¬Ø²Ø¦ÙŠ" },
    fulfillment_failed: { en: "Fulfillment failed", ar: "ÙØ´Ù„ Ø§Ù„ØªÙ†ÙÙŠØ°" },
    manual_review: { en: "Manual review", ar: "Ù…Ø±Ø§Ø¬Ø¹Ø© ÙŠØ¯ÙˆÙŠØ©" },
    refund_pending: { en: "Refund pending", ar: "Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±" },
    refunded: { en: "Refunded", ar: "ØªÙ… Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯" },
    cancelled: { en: "Cancelled", ar: "Ù…Ù„ØºÙ‰" },
  };
  return copy[status][locale];
}

export function localizedPaymentStatus(status: PaymentStatus, locale: "en" | "ar"): string {
  const copy: Record<PaymentStatus, Localized> = {
    not_started: { en: "Not started", ar: "Ù„Ù… ÙŠØ¨Ø¯Ø£" },
    processing: { en: "Processing", ar: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©" },
    authorized: { en: "Authorized", ar: "Ù…ÙÙˆÙ‘Ø¶" },
    captured: { en: "Captured", ar: "Ù…Ø­ØµÙ‘Ù„" },
    failed: { en: "Failed", ar: "ÙØ´Ù„" },
    cancelled: { en: "Cancelled", ar: "Ù…Ù„ØºÙ‰" },
    refunded: { en: "Refunded", ar: "Ù…Ø³ØªØ±Ø¯" },
    partially_refunded: { en: "Partially refunded", ar: "Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø¬Ø²Ø¦ÙŠ" },
  };
  return copy[status][locale];
}

export function localizedFulfillmentStatus(status: FulfillmentStatus, locale: "en" | "ar"): string {
  const copy: Record<FulfillmentStatus, Localized> = {
    not_started: { en: "Not started", ar: "Ù„Ù… ÙŠØ¨Ø¯Ø£" },
    queued: { en: "Queued", ar: "ÙÙŠ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©" },
    processing: { en: "Processing", ar: "Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°" },
    fulfilled: { en: "Fulfilled", ar: "ØªÙ… Ø§Ù„ØªØ³Ù„ÙŠÙ…" },
    partially_fulfilled: { en: "Partially fulfilled", ar: "ØªØ³Ù„ÙŠÙ… Ø¬Ø²Ø¦ÙŠ" },
    failed: { en: "Failed", ar: "ÙØ´Ù„" },
    manual_review: { en: "Manual review", ar: "Ù…Ø±Ø§Ø¬Ø¹Ø© ÙŠØ¯ÙˆÙŠØ©" },
  };
  return copy[status][locale];
}

export function localizedRefundStatus(status: RefundStatus, locale: "en" | "ar"): string {
  const copy: Record<RefundStatus, Localized> = {
    none: { en: "None", ar: "Ù„Ø§ ÙŠÙˆØ¬Ø¯" },
    requested: { en: "Requested", ar: "Ù…Ø·Ù„ÙˆØ¨" },
    reviewing: { en: "Reviewing", ar: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©" },
    approved: { en: "Approved", ar: "Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡" },
    rejected: { en: "Rejected", ar: "Ù…Ø±ÙÙˆØ¶" },
    processing: { en: "Processing", ar: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©" },
    completed: { en: "Completed", ar: "Ù…ÙƒØªÙ…Ù„" },
  };
  return copy[status][locale];
}

/** True when payment succeeded but delivery is not yet confirmed. */
export function isPaymentConfirmedNotDelivered(status: OrderDisplayStatus): boolean {
  return (
    status === "payment_confirmed" ||
    status === "fulfillment_processing" ||
    status === "manual_review"
  );
}

// ============ Quote ============

/**
 * Overall availability of a temporary checkout quote.
 * Payment must only proceed when status is `available` and the quote has not expired.
 */
export type QuoteAvailabilityStatus =
  "available" | "price_changed" | "product_unavailable" | "expired";

export type QuoteLine = {
  productId: string;
  sku: string;
  title: Localized;
  quantity: number;
  /** Trusted selling unit price from the catalog (not the cart). */
  unitPrice: number;
  /** Optional client-expected unit price used to detect price drift. */
  clientUnitPrice?: number;
  totalPrice: number;
  currency: CurrencyCode;
  regionCode: string;
  regionLabel: Localized;
  redemptionCurrency?: CurrencyCode;
  available: boolean;
};

export type CheckoutQuote = {
  id: string;
  createdAt: IsoDateTime;
  /** ISO string. UI must request a fresh quote when this passes. */
  expiresAt: IsoDateTime;
  /** Line items priced from trusted catalog data. */
  items: QuoteLine[];
  /** Compatibility alias for `items`. */
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  tax: number;
  /** Compatibility alias for `tax` (VAT). */
  vat: number;
  fees: number;
  total: number;
  /** Primary payable currency (same as paymentCurrency). */
  currency: CurrencyCode;
  /** Currency the customer is actually charged in. */
  paymentCurrency: CurrencyCode;
  /** Currency shown to the customer for reference. */
  displayCurrency: CurrencyCode;
  /** Market country used when the quote was priced (ISO alpha-2). */
  country: string;
  /** Representative region code for the quote (e.g. KSA, GLOBAL). */
  regionCode: string;
  promoCode?: string;
  availabilityStatus: QuoteAvailabilityStatus;
  /** Warnings surfaced in the UI (region mismatch, stock changed, price changed, ...). */
  warnings: QuoteWarning[];
};

/** Compatibility name used by the existing checkout route and mock service. */
export type Quote = CheckoutQuote;

export type QuoteWarning =
  | {
      kind: "price_changed";
      productId: string;
      oldPrice: number;
      newPrice: number;
      message: Localized;
    }
  | { kind: "stock_changed"; productId: string; message: Localized }
  | { kind: "region_mismatch"; productId: string; message: Localized }
  | { kind: "product_unavailable"; productId: string; message: Localized }
  | { kind: "promo_applied"; code: string; message: Localized }
  | { kind: "promo_invalid"; code: string; message: Localized };

// ============ Order ============

export type OrderCode = {
  /** Rendered LTR even in RTL layouts. */
  value: string;
  redeemedAt?: string;
};

type OrderItemBase = {
  id: string;
  productId: string;
  title: Localized;
  regionCode: string;
  quantity: number;
  unitPrice: number;
  fulfillmentStatus: FulfillmentStatus;
};

export type GiftCardOrderItem = OrderItemBase & {
  productKind: "gift_card";
  denominationLabel: string;
  code?: OrderCode;
};

export type DirectTopUpOrderItem = OrderItemBase & {
  productKind: "direct_topup";
  packageLabel: string;
  fulfillmentFields: FieldValues;
  transactionId?: string;
};

export type OrderItem = GiftCardOrderItem | DirectTopUpOrderItem;

export type OrderEvent = {
  displayStatus: OrderDisplayStatus;
  at: IsoDateTime;
  note?: Localized;
};

export type Order = {
  id: string;
  quoteId: string;
  createdAt: IsoDateTime;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  refundStatus: RefundStatus;
  /** Always derived via `deriveOrderDisplayStatus` â€” do not set ad hoc. */
  displayStatus: OrderDisplayStatus;
  items: OrderItem[];
  paymentMethod: string;
  paymentCurrency: CurrencyCode;
  total: number;
  events: OrderEvent[];
};

export function isQuoteExpired(quote: Pick<CheckoutQuote, "expiresAt">, now = Date.now()): boolean {
  return Date.parse(quote.expiresAt) <= now;
}

export function withDerivedDisplayStatus(
  order: Omit<Order, "displayStatus"> & { displayStatus?: OrderDisplayStatus },
): Order {
  return {
    ...order,
    displayStatus: deriveOrderDisplayStatus(
      order.paymentStatus,
      order.fulfillmentStatus,
      order.refundStatus,
    ),
  };
}

// ============ Store Credit ============

/**
 * NETRO Store Credit (formerly "Wallet").
 * No deposits, withdrawals, or peer-to-peer transfers. Only:
 *  - refund_credit: refunds credited back to the customer.
 *  - promo_credit:  promotional / bonus credit issued by NETRO.
 *  - purchase:      spend at checkout.
 */
export type CreditTxnKind = "refund_credit" | "promo_credit" | "purchase" | "adjustment";

export type CreditTxn = {
  id: string;
  kind: CreditTxnKind;
  amount: number;
  currency: CurrencyCode;
  createdAt: string;
  description: Localized;
  orderId?: string;
};

export type StoreCredit = {
  balance: number;
  currency: CurrencyCode;
  transactions: CreditTxn[];
};
