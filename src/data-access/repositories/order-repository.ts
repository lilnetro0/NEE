import type {
  CheckoutQuote,
  FulfillmentStatus,
  Order,
  OrderDisplayStatus,
} from "@/domain/order";
import type { CurrencyCode } from "@/domain/common";
import type { FieldValues } from "@/domain/forms";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type OrderListParams = {
  displayStatus?: OrderDisplayStatus;
};

export type CreateQuoteInput = {
  items: {
    productId: string;
    sku: string;
    quantity: number;
    fulfillmentFields?: FieldValues;
  }[];
  country: string;
  paymentCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
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
  refreshQuote(quoteId: string, options?: RequestOptions): Promise<Result<CheckoutQuote>>;
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
