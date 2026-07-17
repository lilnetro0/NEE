/** Text rendered in either supported NETRO locale. */
export type Localized = Readonly<{
  en: string;
  ar: string;
}>;

/** ISO-4217 currencies currently supported by NETRO's mock domain. */
export type CurrencyCode =
  "SAR" | "AED" | "KWD" | "BHD" | "OMR" | "QAR" | "EGP" | "USD" | "EUR" | "GBP";

/** ISO-8601 timestamp represented at API and persistence boundaries. */
export type IsoDateTime = string;
