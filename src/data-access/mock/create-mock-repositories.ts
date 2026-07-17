import type { Repositories } from "../repositories";
import { createMockNotificationRepository } from "./mock-notification-repository";
import { createMockOrderRepository } from "./mock-order-repository";
import { createMockProductRepository } from "./mock-product-repository";
import { createMockPromotionRepository } from "./mock-promotion-repository";
import { createMockSupportRepository } from "./mock-support-repository";
import { createMockUserRepository } from "./mock-user-repository";

/**
 * Factory for the mock repository graph.
 * Prefer injecting the result via RepositoriesProvider so tests can swap fakes.
 */
export function createMockRepositories(): Repositories {
  return {
    products: createMockProductRepository(),
    orders: createMockOrderRepository(),
    users: createMockUserRepository(),
    notifications: createMockNotificationRepository(),
    support: createMockSupportRepository(),
    promotions: createMockPromotionRepository(),
  };
}
