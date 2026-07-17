import { orders as seedOrders } from "@/data/orders";
import type { FulfillmentStatus, Order } from "@/domain/order";
import { withDerivedDisplayStatus } from "@/domain/order";
import { toOrderListBucket } from "@/domain/order";
import type { RequestOptions } from "../options";
import { err, notFoundError, ok } from "../result";
import type {
  CreateOrderInput,
  CreateQuoteInput,
  OrderListParams,
  OrderRepository,
} from "../repositories/order-repository";
import { withMockLatency } from "./delay";
import { assertQuotePayable, buildCheckoutQuote, refreshCheckoutQuote } from "./mock-quote-service";

/** Runtime orders created in this session (mock only). */
const liveOrders = new Map<string, Order>();
/** Poll counters for newly created orders progressing through fulfillment. */
const fulfillmentTicks = new Map<string, number>();

function allOrders(): Order[] {
  const map = new Map<string, Order>();
  for (const o of seedOrders) map.set(o.id, o);
  for (const o of liveOrders.values()) map.set(o.id, o);
  return [...map.values()];
}

function findOrder(id: string): Order | undefined {
  return liveOrders.get(id) ?? seedOrders.find((o) => o.id === id);
}

export function createMockOrderRepository(): OrderRepository {
  return {
    async list(params?: OrderListParams, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          let list = allOrders();
          if (params?.displayStatus) {
            list = list.filter((o) => o.displayStatus === params.displayStatus);
          } else if (params?.bucket) {
            list = list.filter((o) => toOrderListBucket(o.displayStatus) === params.bucket);
          }
          return ok(list);
        },
        options,
      );
    },

    async getById(id: string, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          const order = findOrder(id) ?? seedOrders[0];
          return order ? ok(order) : notFoundError("Order", id);
        },
        options,
      );
    },

    async create(input: CreateOrderInput, options?: RequestOptions) {
      return withMockLatency(
        300,
        () => {
          const payable = assertQuotePayable(input.quoteId);
          if (!payable.ok) return payable;

          const quote = payable.data;
          const id = `NTR-${Date.now().toString(36).toUpperCase()}`;
          const created = withDerivedDisplayStatus({
            id,
            quoteId: input.quoteId,
            paymentMethod: input.paymentMethod,
            paymentCurrency: quote.paymentCurrency,
            total: quote.total,
            paymentStatus: "captured",
            fulfillmentStatus: "queued",
            refundStatus: "none",
            createdAt: new Date().toISOString(),
            items: quote.items.map((line, index) => {
              const productKind =
                line.redemptionCurrency !== undefined
                  ? ("gift_card" as const)
                  : ("direct_topup" as const);
              if (productKind === "gift_card") {
                return {
                  id: `${id}-item-${index}`,
                  productId: line.productId,
                  productKind,
                  title: line.title,
                  regionCode: line.regionCode,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                  fulfillmentStatus: "queued" as const,
                  denominationLabel: line.sku,
                };
              }
              return {
                id: `${id}-item-${index}`,
                productId: line.productId,
                productKind,
                title: line.title,
                regionCode: line.regionCode,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                fulfillmentStatus: "queued" as const,
                packageLabel: line.sku,
                fulfillmentFields: {},
              };
            }),
            events: [
              {
                displayStatus: "payment_confirmed",
                at: new Date().toISOString(),
                note: {
                  en: "Payment captured (mock — no real charge).",
                  ar: "تم تحصيل الدفع (تجريبي — بلا خصم حقيقي).",
                },
              },
              {
                displayStatus: "fulfillment_processing",
                at: new Date().toISOString(),
                note: {
                  en: "Fulfillment queued with supplier.",
                  ar: "أُضيف التنفيذ إلى قائمة المورّد.",
                },
              },
            ],
          });

          liveOrders.set(id, created);
          fulfillmentTicks.set(id, 0);
          return ok(created);
        },
        options,
      );
    },

    async createQuote(input: CreateQuoteInput, options?: RequestOptions) {
      return withMockLatency(250, () => buildCheckoutQuote(input), options);
    },

    async refreshQuote(
      quoteId: string,
      options?: RequestOptions & { simulate?: CreateQuoteInput["simulate"] },
    ) {
      return withMockLatency(250, () => refreshCheckoutQuote(quoteId, options?.simulate), options);
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
          const order = findOrder(orderId);
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
          const order = findOrder(orderId);
          if (!order) return notFoundError("Order", orderId);

          // Scenario / seed orders keep their current fulfillment status.
          if (!liveOrders.has(orderId)) {
            return ok({ state: order.fulfillmentStatus });
          }

          const ticks = (fulfillmentTicks.get(orderId) ?? 0) + 1;
          fulfillmentTicks.set(orderId, ticks);

          let next: FulfillmentStatus = order.fulfillmentStatus;
          if (ticks === 1) next = "processing";
          if (ticks >= 2) next = "fulfilled";

          if (next !== order.fulfillmentStatus) {
            const updated = withDerivedDisplayStatus({
              ...order,
              fulfillmentStatus: next,
              items: order.items.map((item) => ({
                ...item,
                fulfillmentStatus: next,
                ...(next === "fulfilled" && item.productKind === "gift_card" && !item.code
                  ? { code: { value: "MOCK-CODE-DELIVERED" } }
                  : {}),
              })),
              events: [
                ...order.events,
                {
                  displayStatus:
                    next === "fulfilled"
                      ? ("fulfilled" as const)
                      : ("fulfillment_processing" as const),
                  at: new Date().toISOString(),
                  note:
                    next === "fulfilled"
                      ? { en: "Delivery confirmed", ar: "تم تأكيد التسليم" }
                      : { en: "Fulfillment processing", ar: "جاري التنفيذ" },
                },
              ],
            });
            liveOrders.set(orderId, updated);
          }

          return ok({ state: next });
        },
        options,
      );
    },
  };
}
