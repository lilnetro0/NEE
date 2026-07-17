import type {
  CheckoutQuote,
  FulfillmentStatus,
  Order,
  OrderDisplayStatus,
  OrderListBucket,
} from "@/domain/order";
import type { CurrencyCode } from "@/domain/common";
import type { FieldValues } from "@/domain/forms";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type OrderListParams = {
  /** Exact lifecycle status. */
  displayStatus?: OrderDisplayStatus;
  /** Coarse list filter bucket. */
  bucket?: OrderListBucket;
};

export type CreateQuoteItemInput = {
  productId: string;
  sku: string;
  quantity: number;
  /** Client-expected unit price from the cart draft (for price-change detection). */
  clientUnitPrice?: number;
  fulfillmentFields?: FieldValues;
};

export type CreateQuoteInput = {
  items: CreateQuoteItemInput[];
  country: string;
  paymentCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  /** Optional promo code evaluated by the quote service. */
  promoCode?: string;
  /**
   * Mock-only simulation knobs. Ignored by a real backend.
   * - price_changed: bump trusted prices vs the client expectation
   * - product_unavailable: force at least one line out of stock
   */
  simulate?: "price_changed" | "product_unavailable";
};

export type CreateOrderInput = {
  quoteId: string;
  paymentMethod: string;
};

export type OrderRepository = {
  list(params?: OrderListParams, options?: RequestOptions): Promise<Result<Order[]>>;
  getById(id: string, options?: RequestOptions): Promise<Result<Order>>;
  create(input: CreateOrderInput, options?: RequestOptions): Promise<Result<Order>>;
  createQuote(input: CreateQuoteInput, options?: RequestOptions): Promise<Result<CheckoutQuote>>;
  refreshQuote(
    quoteId: string,
    options?: RequestOptions & { simulate?: CreateQuoteInput["simulate"] },
  ): Promise<Result<CheckoutQuote>>;
  revealCode(
    orderId: string,
    itemIndex: number,
    reauthToken: string,
    options?: RequestOptions,
  ): Promise<Result<string>>;
  pollFulfillment(
    orderId: string,
    options?: RequestOptions,
  ): Promise<Result<{ state: FulfillmentStatus }>>;
};
