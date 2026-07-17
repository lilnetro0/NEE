import type { StoreCredit } from "@/domain/order";
import type { RequestOptions } from "../options";
import { ok } from "../result";
import type { UserRepository } from "../repositories/user-repository";
import { withMockLatency } from "./delay";
import { getMockAuthUser } from "./mock-auth-repository";

const STORE_CREDIT: StoreCredit = {
  balance: 42.5,
  currency: "SAR",
  transactions: [
    {
      id: "t1",
      kind: "refund_credit",
      amount: 25,
      currency: "SAR",
      createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
      description: { en: "Refund · NTR-2810391", ar: "استرداد · NTR-2810391" },
    },
    {
      id: "t2",
      kind: "promo_credit",
      amount: 20,
      currency: "SAR",
      createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
      description: { en: "Welcome bonus", ar: "مكافأة ترحيبية" },
    },
    {
      id: "t3",
      kind: "purchase",
      amount: -2.5,
      currency: "SAR",
      createdAt: new Date(Date.now() - 8 * 86400_000).toISOString(),
      description: { en: "Order NTR-2810127", ar: "طلب NTR-2810127" },
    },
  ],
};

/**
 * Profile / wallet reads only. Authentication lives on AuthRepository.
 */
export function createMockUserRepository(): UserRepository {
  return {
    async getCurrent(options?: RequestOptions) {
      return withMockLatency(0, () => ok(getMockAuthUser()), options);
    },

    async getStoreCredit(options?: RequestOptions) {
      return withMockLatency(120, () => ok(STORE_CREDIT), options);
    },
  };
}
