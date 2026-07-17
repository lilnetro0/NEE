/**
 * Checkout state machine, order lifecycle and quote model.
 *
 * The checkout is deliberately not a single boolean "success" — it is a
 * sequence of explicit states that map 1:1 to backend events and to the
 * user-facing status screens under /order/$id/*.
 */

import type { CurrencyCode, IsoDateTime, Localized } from "./common";
import type { FieldValues } from "./forms";

// ============ Checkout state machine ============

export type CheckoutState =
  | "draft"
  | "validating"
  | "awaiting_payment"
  | "payment_processing"
  | "payment_authorized"
  | "order_created"
  | "fulfillment_pending"
  | "fulfillment_processing"
  | "fulfilled"
  | "partially_fulfilled"
  | "fulfillment_failed"
  | "manual_review"
  | "refund_pending"
  | "refunded"
  | "cancelled";

/** State grouping helpers for UI. */
export const CHECKOUT_TERMINAL: CheckoutState[] = ["fulfilled", "cancelled", "refunded"];
export const CHECKOUT_ERROR: CheckoutState[] = ["fulfillment_failed"];

// ============ Quote ============

export type QuoteLine = {
  productId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: CurrencyCode;
  regionCode: string;
  redemptionCurrency?: CurrencyCode;
};

export type CheckoutQuote = {
  id: string;
  createdAt: string;
  /** ISO string. UI must refresh when this passes. */
  expiresAt: string;
  lines: QuoteLine[];
  subtotal: number;
  vat: number;
  fees: number;
  total: number;
  /** Currency the customer is actually charged in. */
  paymentCurrency: CurrencyCode;
  /** Currency shown to the customer for reference. */
  displayCurrency: CurrencyCode;
  /** Warnings surfaced in the UI (region mismatch, stock changed, price changed, ...). */
  warnings: QuoteWarning[];
};

/** Compatibility name used by the existing checkout route and mock service. */
export type Quote = CheckoutQuote;

export type QuoteWarning =
  | { kind: "price_changed"; productId: string; oldPrice: number; newPrice: number }
  | { kind: "stock_changed"; productId: string; message: Localized }
  | { kind: "region_mismatch"; productId: string; message: Localized }
  | { kind: "product_unavailable"; productId: string; message: Localized };

// ============ Order ============

export type OrderCode = {
  /** Rendered LTR even in RTL layouts. */
  value: string;
  redeemedAt?: string;
};

export type PaymentStatus =
  "pending" | "processing" | "authorized" | "paid" | "failed" | "cancelled";

export type FulfillmentStatus =
  | "not_started"
  | "pending"
  | "processing"
  | "fulfilled"
  | "partially_fulfilled"
  | "failed"
  | "manual_review";

export type RefundStatus =
  "not_requested" | "requested" | "processing" | "partially_refunded" | "refunded" | "rejected";

export type OrderDisplayStatus = "processing" | "completed" | "failed" | "refunded";

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
  displayStatus: OrderDisplayStatus;
  items: OrderItem[];
  paymentMethod: string;
  paymentCurrency: CurrencyCode;
  total: number;
  events: OrderEvent[];
};

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
