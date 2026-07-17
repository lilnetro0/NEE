import type { Promotion } from "@/domain/promotion";
import type { RequestOptions } from "../options";
import { ok } from "../result";
import type { PromotionRepository } from "../repositories/promotion-repository";
import { withMockLatency } from "./delay";

const PROMOTIONS: Promotion[] = [
  {
    id: "promo-netro10",
    code: "NETRO10",
    title: {
      en: "10% off your next order",
      ar: "خصم 10% على طلبك القادم",
    },
    expiresLabel: { en: "Dec 31", ar: "٣١ ديسمبر" },
  },
  {
    id: "promo-gamer25",
    code: "GAMER25",
    title: {
      en: "25% off Spotify Premium",
      ar: "خصم 25% على سبوتيفاي بريميوم",
    },
    expiresLabel: { en: "This week", ar: "هذا الأسبوع" },
  },
  {
    id: "promo-welcome",
    code: "WELCOME",
    title: {
      en: "SAR 20 credit on first order",
      ar: "رصيد ٢٠ ر.س مع أول طلب",
    },
    expiresLabel: { en: "One-time", ar: "مرة واحدة" },
  },
];

export function createMockPromotionRepository(): PromotionRepository {
  return {
    async list(options?: RequestOptions) {
      return withMockLatency(0, () => ok(PROMOTIONS), options);
    },
  };
}
