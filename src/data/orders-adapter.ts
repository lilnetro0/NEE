import type { Order } from "@/domain/order";
import { orders } from "./orders";

export function mockOrders(): Order[] {
  return orders;
}
