import type { Promotion } from "@/domain/promotion";
import type { PromotionRepository } from "../repositories/promotion-repository";
import type { NetroApiClient } from "./api-client";

export function createHttpPromotionRepository(client: NetroApiClient): PromotionRepository {
  return {
    list(options) {
      return client.get<Promotion[]>("/v1/promotions", { signal: options?.signal });
    },
  };
}
