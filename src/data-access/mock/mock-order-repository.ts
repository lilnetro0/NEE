import { orders } from "@/data/orders";
import type { CheckoutQuote, Order } from "@/domain/order";
import type { RequestOptions } from "../options";
import { err, notFoundError, ok } from "../result";
import type {
  CreateOrderInput,
  CreateQuoteInput,
  OrderListParams,
  OrderRepository,
} from "../repositories/order-repository";
import { withMockLatency } from "./delay";

function buildQuote(input: CreateQuoteInput, quoteId?: string): CheckoutQuote {
  const now = Date.now();
  return {
    id: quoteId ?? `Q-${now.toString(36).toUpperCase()}`,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 5 * 60_000).toISOString(),
    lines: input.items.map((it) => ({
      productId: it.productId,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: 50,
      totalPrice: 50 * it.quantity,
      currency: input.displayCurrency,
      regionCode: "GLOBAL",
    })),
    subtotal: 50,
    vat: 7.5,
    fees: 0,
    total: 57.5,
    paymentCurrency: input.paymentCurrency,
    displayCurrency: input.displayCurrency,
    warnings: [],
  };
}

export function createMockOrderRepository(): OrderRepository {
  return {
    async list(params?: OrderListParams, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          const list = params?.displayStatus
            ? orders.filter((o) => o.displayStatus === params.displayStatus)
            : orders;
          return ok(list);
        },
        options,
      );
    },

    async getById(id: string, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          // Preserve previous UI behavior: unknown ids fall back to the first seed order.
          const order = orders.find((o) => o.id === id) ?? orders[0];
          return order ? ok(order) : notFoundError("Order", id);
        },
        options,
      );
    },

    async create(input: CreateOrderInput, options?: RequestOptions) {
      return withMockLatency(
        300,
        () => {
          const seed = orders[0];
          if (!seed) return notFoundError("Order");
          const created: Order = {
            ...seed,
            id: `NTR-${Date.now().toString(36).toUpperCase()}`,
            quoteId: input.quoteId,
            paymentMethod: input.paymentMethod,
          };
          return ok(created);
        },
        options,
      );
    },

    async createQuote(input: CreateQuoteInput, options?: RequestOptions) {
      return withMockLatency(200, () => ok(buildQuote(input)), options);
    },

    async refreshQuote(quoteId: string, options?: RequestOptions) {
      return withMockLatency(
        200,
        () =>
          ok(
            buildQuote(
              {
                items: [],
                country: "SA",
                paymentCurrency: "SAR",
                displayCurrency: "SAR",
              },
              quoteId,
            ),
          ),
        options,
      );
    },

    async revealCode(
      orderId: string,
      itemIndex: number,
      reauthToken: string,
      options?: RequestOptions,
    ) {
      return withMockLatency(
        250,
        () => {
          if (!reauthToken) return err("unauthorized", "REAUTH_REQUIRED");
          const order = orders.find((o) => o.id === orderId);
          const item = order?.items[itemIndex];
          if (item?.productKind === "gift_card") {
            return ok(item.code?.value ?? "XXXX-XXXX-XXXX");
          }
          return ok("XXXX-XXXX-XXXX");
        },
        options,
      );
    },

    async pollFulfillment(orderId: string, options?: RequestOptions) {
      return withMockLatency(
        400,
        () => {
          void orderId;
          return ok({ state: "fulfilled" as const });
        },
        options,
      );
    },
  };
}
