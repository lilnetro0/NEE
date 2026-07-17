import type { NotificationRepository } from "./notification-repository";
import type { OrderRepository } from "./order-repository";
import type { ProductRepository } from "./product-repository";
import type { PromotionRepository } from "./promotion-repository";
import type { SupportRepository } from "./support-repository";
import type { UserRepository } from "./user-repository";

export type Repositories = {
  products: ProductRepository;
  orders: OrderRepository;
  users: UserRepository;
  notifications: NotificationRepository;
  support: SupportRepository;
  promotions: PromotionRepository;
};

export type { NotificationRepository } from "./notification-repository";
export type { OrderRepository } from "./order-repository";
export type { ProductRepository } from "./product-repository";
export type { PromotionRepository } from "./promotion-repository";
export type { SupportRepository } from "./support-repository";
export type { UserRepository } from "./user-repository";
