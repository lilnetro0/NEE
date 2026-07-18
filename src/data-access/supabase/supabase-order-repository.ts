import type { OrderRepository } from "../repositories/order-repository";
import type { RequestOptions } from "../options";
import { cancelledError, notFoundError, ok } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapDbFulfillmentToDomain, mapOrder, mapQuote } from "./mappers";
import { deriveOrderDisplayStatus, toOrderListBucket } from "@/domain/order";
import { mapDbPaymentToDomain, mapDbRefundToDomain } from "./mappers";

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

async function invoke<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: Error | null }> {
  const { data, error } = await getSupabaseClient().functions.invoke(name, { body });
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as T, error: null };
}

export function createSupabaseOrderRepository(): OrderRepository {
  return {
    async list(params, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return mapSupabaseError({ message: "UNAUTHORIZED" });
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return mapSupabaseError(error);
      const ids = (orders ?? []).map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const itemsByOrder = new Map<string, typeof items>();
      for (const item of items ?? []) {
        const list = itemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        itemsByOrder.set(item.order_id, list);
      }
      let mapped = (orders ?? []).map((order) => mapOrder(order, itemsByOrder.get(order.id) ?? []));
      if (params?.displayStatus) {
        mapped = mapped.filter((o) => o.displayStatus === params.displayStatus);
      }
      if (params?.bucket) {
        mapped = mapped.filter((o) => toOrderListBucket(o.displayStatus) === params.bucket);
      }
      return ok(mapped);
    },

    async getById(id, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!order) return notFoundError("Order", id);
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);
      if (itemsError) return mapSupabaseError(itemsError);
      return ok(mapOrder(order, items ?? []));
    },

    async create(input, options) {
      if (aborted(options)) return cancelledError();
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`;
      const { data, error } = await invoke<{ orderId: string }>("create-order", {
        quoteId: input.quoteId,
        paymentMethod: input.paymentMethod,
        idempotencyKey,
      });
      if (error || !data?.orderId)
        return mapSupabaseError({ message: error?.message ?? "UNKNOWN" });
      return this.getById(data.orderId, options);
    },

    async createQuote(input, options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await invoke<{ quoteId: string }>("create-quote", {
        items: input.items,
        country: input.country,
        paymentCurrency: input.paymentCurrency,
        displayCurrency: input.displayCurrency,
        promoCode: input.promoCode,
        simulate: input.simulate,
      });
      if (error || !data?.quoteId)
        return mapSupabaseError({ message: error?.message ?? "UNKNOWN" });
      const supabase = getSupabaseClient();
      const { data: quote, error: qErr } = await supabase
        .from("checkout_quotes")
        .select("*")
        .eq("id", data.quoteId)
        .single();
      if (qErr || !quote) return mapSupabaseError(qErr ?? { message: "not found" });
      const { data: items } = await supabase
        .from("checkout_quote_items")
        .select("*")
        .eq("quote_id", data.quoteId);
      return ok(mapQuote(quote, items ?? []));
    },

    async refreshQuote(quoteId, options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await invoke<{ quoteId: string }>("refresh-quote", {
        quoteId,
        simulate: options?.simulate,
      });
      if (error || !data?.quoteId)
        return mapSupabaseError({ message: error?.message ?? "UNKNOWN" });
      const supabase = getSupabaseClient();
      const { data: quote, error: qErr } = await supabase
        .from("checkout_quotes")
        .select("*")
        .eq("id", data.quoteId)
        .single();
      if (qErr || !quote) return mapSupabaseError(qErr ?? { message: "not found" });
      const { data: items } = await supabase
        .from("checkout_quote_items")
        .select("*")
        .eq("quote_id", data.quoteId);
      return ok(mapQuote(quote, items ?? []));
    },

    async revealCode(orderId, itemIndex, reauthToken, options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await invoke<{ code: string }>("reveal-code", {
        orderId,
        itemIndex,
        reauthToken,
      });
      if (error || !data?.code)
        return mapSupabaseError({ message: error?.message ?? "UNAUTHORIZED" });
      return ok(data.code);
    },

    async pollFulfillment(orderId, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: order, error } = await supabase
        .from("orders")
        .select("fulfillment_status,payment_status,refund_status")
        .eq("id", orderId)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!order) return notFoundError("Order", orderId);
      // Keep display derivation consistent even though we only return fulfillment state
      void deriveOrderDisplayStatus(
        mapDbPaymentToDomain(order.payment_status),
        mapDbFulfillmentToDomain(order.fulfillment_status),
        mapDbRefundToDomain(order.refund_status),
      );
      return ok({ state: mapDbFulfillmentToDomain(order.fulfillment_status) });
    },
  };
}
