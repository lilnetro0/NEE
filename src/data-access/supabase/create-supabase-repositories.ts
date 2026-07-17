/**
 * Repository graph bootstrap — Supabase only.
 * Mocks and Laravel HTTP clients have been removed.
 */

import { getPublicEnv } from "@/config/env";
import { logger } from "@/lib/logger";
import type { Repositories } from "../repositories";
import { createSupabaseAuthRepository } from "./supabase-auth-repository";
import { createSupabaseNotificationRepository } from "./supabase-notification-repository";
import { createSupabaseOrderRepository } from "./supabase-order-repository";
import { createSupabaseProductRepository } from "./supabase-product-repository";
import { createSupabasePromotionRepository } from "./supabase-promotion-repository";
import { createSupabaseSupportRepository } from "./supabase-support-repository";
import { createSupabaseUserRepository } from "./supabase-user-repository";

export type RepositoryMode = "supabase";

export function createSupabaseRepositories(): Repositories {
  return {
    products: createSupabaseProductRepository(),
    orders: createSupabaseOrderRepository(),
    users: createSupabaseUserRepository(),
    auth: createSupabaseAuthRepository(),
    notifications: createSupabaseNotificationRepository(),
    support: createSupabaseSupportRepository(),
    promotions: createSupabasePromotionRepository(),
  };
}

export function createRepositoriesFromEnv(): {
  mode: RepositoryMode;
  repositories: Repositories;
} {
  const env = getPublicEnv();
  logger.info("Using Supabase repositories", { appEnv: env.appEnv });
  return {
    mode: "supabase",
    repositories: createSupabaseRepositories(),
  };
}
