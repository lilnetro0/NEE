/**
 * Repository graph bootstrap.
 *
 * - Development / preview: mocks when VITE_USE_MOCKS=true
 * - Production: HTTP repositories only — never silently falls back to mocks
 *
 * All HTTP traffic targets the NETRO backend (VITE_API_BASE_URL).
 * Distributor APIs are never called from the browser.
 */

import { getPublicEnv, EnvConfigError } from "@/config/env";
import { logger } from "@/lib/logger";
import { createMockRepositories } from "../mock/create-mock-repositories";
import type { Repositories } from "../repositories";
import { getApiClient, type ApiClientOptions } from "./api-client";
import { createHttpAuthRepository } from "./http-auth-repository";
import { createHttpNotificationRepository } from "./http-notification-repository";
import { createHttpOrderRepository } from "./http-order-repository";
import { createHttpProductRepository } from "./http-product-repository";
import { createHttpPromotionRepository } from "./http-promotion-repository";
import { createHttpSupportRepository } from "./http-support-repository";
import { createHttpUserRepository } from "./http-user-repository";

export type RepositoryMode = "mock" | "http";

export function createHttpRepositories(clientOptions?: ApiClientOptions): Repositories {
  const client = getApiClient(clientOptions);
  return {
    products: createHttpProductRepository(client),
    orders: createHttpOrderRepository(client),
    users: createHttpUserRepository(client),
    auth: createHttpAuthRepository(client),
    notifications: createHttpNotificationRepository(client),
    support: createHttpSupportRepository(client),
    promotions: createHttpPromotionRepository(client),
  };
}

/**
 * Selects mock vs HTTP repositories from validated public env.
 * Throws if production attempts mocks or HTTP mode lacks API base URL.
 */
export function createRepositoriesFromEnv(clientOptions?: ApiClientOptions): {
  mode: RepositoryMode;
  repositories: Repositories;
} {
  const env = getPublicEnv();

  if (env.useMocks) {
    if (env.appEnv === "production" || env.isViteProduction) {
      throw new EnvConfigError("Refusing to start: production cannot use mock repositories.");
    }
    logger.info("Using mock repositories", { appEnv: env.appEnv });
    return { mode: "mock", repositories: createMockRepositories() };
  }

  if (!env.apiBaseUrl) {
    throw new EnvConfigError(
      "Refusing to start: HTTP mode requires VITE_API_BASE_URL pointing at the NETRO backend.",
    );
  }

  logger.info("Using HTTP repositories (NETRO backend)", {
    appEnv: env.appEnv,
    // Intentionally omit full URL host details beyond presence — base URL is public anyway
  });

  return {
    mode: "http",
    repositories: createHttpRepositories(clientOptions),
  };
}
