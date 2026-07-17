import type { User } from "@/domain/user";
import type { StoreCredit } from "@/domain/order";
import type { UserRepository } from "../repositories/user-repository";
import type { NetroApiClient } from "./api-client";

export function createHttpUserRepository(client: NetroApiClient): UserRepository {
  return {
    getCurrent(options) {
      return client.get<User>("/v1/me", { signal: options?.signal });
    },
    getStoreCredit(options) {
      return client.get<StoreCredit>("/v1/me/store-credit", { signal: options?.signal });
    },
  };
}
