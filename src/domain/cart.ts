import type { CurrencyCode } from "./common";
import type { FieldValues } from "./forms";
import type { ProductDenomination, TopUpPackage } from "./product";

type CartItemBase = {
  key: string;
  productId: string;
  title: string;
  regionCode: string;
  regionLabel: string;
  displayCurrency: CurrencyCode;
  quantity: number;
  unitPrice: number;
  color: string;
};

export type GiftCardCartItem = CartItemBase & {
  kind: "gift_card";
  denomination: ProductDenomination;
  redemptionCurrency: CurrencyCode;
};

export type DirectTopUpCartItem = CartItemBase & {
  kind: "direct_topup";
  package: TopUpPackage;
  fulfillmentFields: FieldValues;
};

export type CartItem = GiftCardCartItem | DirectTopUpCartItem;
