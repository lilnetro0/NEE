import type { CurrencyCode, IsoDateTime } from "./common";

export type User = {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  countryCode: string;
  preferredCurrency: CurrencyCode;
  preferredLocale: "en" | "ar";
  createdAt: IsoDateTime;
};
