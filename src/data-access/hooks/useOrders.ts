import { useCallback } from "react";
import type { OrderDisplayStatus, OrderListBucket } from "@/domain/order";
import { useRepositories } from "../RepositoriesProvider";
import { useResultQuery } from "./useResultQuery";

export function useOrders(filter?: OrderDisplayStatus | OrderListBucket | "all") {
  const { orders } = useRepositories();
  const isBucket =
    filter === "processing" ||
    filter === "completed" ||
    filter === "failed" ||
    filter === "refunded" ||
    filter === "cancelled";

  return useResultQuery(
    (signal) => {
      if (!filter || filter === "all") return orders.list(undefined, { signal });
      if (isBucket) return orders.list({ bucket: filter }, { signal });
      return orders.list({ displayStatus: filter }, { signal });
    },
    [orders, filter],
  );
}

export function useOrder(id: string) {
  const { orders } = useRepositories();
  return useResultQuery((signal) => orders.getById(id, { signal }), [orders, id]);
}

export function useOrderMutations() {
  const { orders } = useRepositories();
  return {
    create: useCallback(
      (input: Parameters<typeof orders.create>[0], options?: Parameters<typeof orders.create>[1]) =>
        orders.create(input, options),
      [orders],
    ),
    createQuote: useCallback(
      (
        input: Parameters<typeof orders.createQuote>[0],
        options?: Parameters<typeof orders.createQuote>[1],
      ) => orders.createQuote(input, options),
      [orders],
    ),
    refreshQuote: useCallback(
      (quoteId: string, options?: Parameters<typeof orders.refreshQuote>[1]) =>
        orders.refreshQuote(quoteId, options),
      [orders],
    ),
    pollFulfillment: useCallback(
      (orderId: string, signal?: AbortSignal) => orders.pollFulfillment(orderId, { signal }),
      [orders],
    ),
  };
}
