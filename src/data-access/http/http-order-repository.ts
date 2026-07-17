import type { CheckoutQuote, FulfillmentStatus, Order } from "@/domain/order";
import type { RequestOptions } from "../options";
import type {
  CreateOrderInput,
  CreateQuoteInput,
  OrderListParams,
  OrderRepository,
} from "../repositories/order-repository";
import type { NetroApiClient } from "./api-client";

function qs(params?: OrderListParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.displayStatus) search.set("displayStatus", params.displayStatus);
  if (params.bucket) search.set("bucket", params.bucket);
  const value = search.toString();
  return value ? `?${value}` : "";
}

/** HTTP orders / quotes — NETRO backend only. Never retries POST create. */
export function createHttpOrderRepository(client: NetroApiClient): OrderRepository {
  return {
    list(params, options) {
      return client.get<Order[]>(`/v1/orders${qs(params)}`, { signal: options?.signal });
    },
    getById(id, options) {
      return client.get<Order>(`/v1/orders/${encodeURIComponent(id)}`, {
        signal: options?.signal,
      });
    },
    create(input: CreateOrderInput, options?: RequestOptions) {
      return client.post<Order>("/v1/orders", input, {
        signal: options?.signal,
        idempotencyKey: `order:${input.quoteId}`,
      });
    },
    createQuote(input: CreateQuoteInput, options?: RequestOptions) {
      const { simulate: _simulate, ...body } = input;
      return client.post<CheckoutQuote>("/v1/checkout/quotes", body, {
        signal: options?.signal,
      });
    },
    refreshQuote(quoteId, options) {
      return client.post<CheckoutQuote>(
        `/v1/checkout/quotes/${encodeURIComponent(quoteId)}/refresh`,
        {},
        { signal: options?.signal },
      );
    },
    revealCode(orderId, itemIndex, reauthToken, options) {
      return client.post<string>(
        `/v1/orders/${encodeURIComponent(orderId)}/items/${itemIndex}/reveal-code`,
        { reauthToken },
        { signal: options?.signal },
      );
    },
    pollFulfillment(orderId, options) {
      return client.get<{ state: FulfillmentStatus }>(
        `/v1/orders/${encodeURIComponent(orderId)}/fulfillment`,
        { signal: options?.signal },
      );
    },
  };
}
