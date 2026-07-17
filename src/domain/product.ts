import type { CurrencyCode, Localized } from "./common";
import type { DynamicTopUpField } from "./forms";
import type { Region } from "./regions";

export type ProductBase = {
  id: string;
  brandId: string;
  categoryId: string;
  title: Localized;
  subtitle?: Localized;
  description: Localized;
  color: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  tags?: string[];
  /** Marketing "from" price in display currency. */
  fromPrice: number;
  compareAt?: number;
  /** Display / listing currency (not necessarily card currency). */
  displayCurrency: CurrencyCode;
};

export type ProductDenomination = {
  id: string;
  faceValue: number;
  price: number;
  inStock: boolean;
};

export type GiftCardProduct = ProductBase & {
  kind: "gift_card";
  region: Region;
  redemptionCurrency: CurrencyCode;
  denominations: ProductDenomination[];
  pinDelivery: {
    method: "screen" | "email";
    instant: boolean;
  };
  redemptionInstructions: Localized;
  restrictions?: Localized;
};

export type TopUpPackage = {
  id: string;
  label: string;
  amount: number;
  price: number;
  inStock: boolean;
  /** Bonus items shown in the UI (e.g. "+50 bonus UC"). */
  bonus?: Localized;
};

export type DirectTopUpProduct = ProductBase & {
  kind: "direct_topup";
  game: {
    id: string;
    name: Localized;
    platform?: string;
  };
  region: Region;
  packages: TopUpPackage[];
  requiredFields: DynamicTopUpField[];
  validation: {
    accountLookup: "supported" | "unsupported";
    confirmationRequired: boolean;
  };
  fulfillmentMode: "automatic" | "manual";
  fulfillmentEstimateMinutes: number;
};

export type Product = GiftCardProduct | DirectTopUpProduct;

export const isGiftCard = (p: Product): p is GiftCardProduct => p.kind === "gift_card";
export const isDirectTopUp = (p: Product): p is DirectTopUpProduct => p.kind === "direct_topup";

/** Compatibility guard retained while existing route names still say "topup". */
export const isTopUp = isDirectTopUp;

export type AccountVerification =
  | {
      ok: true;
      nickname?: string;
      server?: string;
      region?: string;
    }
  | {
      ok: false;
      reason: "account_not_found" | "region_mismatch" | "temporarily_unavailable" | "invalid_input";
      message: Localized;
    };
