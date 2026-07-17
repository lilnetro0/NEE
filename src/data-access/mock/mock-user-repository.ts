import type { User } from "@/domain/user";
import type { StoreCredit } from "@/domain/order";
import type { RequestOptions } from "../options";
import { err, ok } from "../result";
import type { UserRepository } from "../repositories/user-repository";
import { withMockLatency } from "./delay";

const CURRENT_USER: User = {
  id: "user-ahmad",
  displayName: "Ahmad Al-Sayed",
  email: "ahmad@example.com",
  phone: "+9665",
  countryCode: "SA",
  preferredCurrency: "SAR",
  preferredLocale: "en",
  createdAt: new Date(Date.now() - 120 * 86400_000).toISOString(),
};

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

export function createMockUserRepository(): UserRepository {
  return {
    async getCurrent(options?: RequestOptions) {
      return withMockLatency(0, () => ok(CURRENT_USER), options);
    },

    async getStoreCredit(options?: RequestOptions) {
      return withMockLatency(120, () => ok(STORE_CREDIT), options);
    },

    async reauth(_password: string, options?: RequestOptions) {
      return withMockLatency(
        300,
        () =>
          ok({
            token: "reauth-" + Date.now(),
            expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
          }),
        options,
      );
    },

    async listSessions(options?: RequestOptions) {
      return withMockLatency(
        150,
        () =>
          ok([
            {
              id: "s1",
              device: "iPhone 15 Pro",
              location: "Riyadh, SA",
              lastActive: new Date().toISOString(),
              current: true,
            },
            {
              id: "s2",
              device: "MacBook Pro",
              location: "Riyadh, SA",
              lastActive: new Date(Date.now() - 3600_000).toISOString(),
              current: false,
            },
          ]),
        options,
      );
    },

    async revokeSession(_id: string, options?: RequestOptions) {
      return withMockLatency(200, () => ok(undefined), options);
    },

    async deleteAccount(_password: string, options?: RequestOptions) {
      return withMockLatency(400, () => ok(undefined), options);
    },

    async requestEmailChange(_email: string, options?: RequestOptions) {
      return withMockLatency(200, () => ok(undefined), options);
    },

    async verifyEmailChange(code: string, options?: RequestOptions) {
      return withMockLatency(
        200,
        () =>
          code.length === 6
            ? ok(undefined)
            : err("validation", "INVALID_CODE"),
        options,
      );
    },

    async requestPhoneChange(_phone: string, options?: RequestOptions) {
      return withMockLatency(200, () => ok(undefined), options);
    },

    async verifyPhoneChange(code: string, options?: RequestOptions) {
      return withMockLatency(
        200,
        () =>
          code.length === 6
            ? ok(undefined)
            : err("validation", "INVALID_CODE"),
        options,
      );
    },
  };
}
