/**
 * Customer country vs display currency vs product region vs card currency
 * vs payment currency. Strictly separate — the UI must never conflate them.
 */

import type { CurrencyCode, Localized } from "./common";

export type Region = Readonly<{
  /** Stable redemption-region code sent across application boundaries. */
  code: string;
  name: Localized;
}>;

export type Country = {
  code: string;
  name: Localized;
  flag: string;
  defaultCurrency: CurrencyCode;
  /** Country dial code, always rendered LTR. */
  dialCode: string;
};

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  name: Localized;
  /** Rate against a common reference (USD). Display only. */
  usdRate: number;
};

export const COUNTRIES: Country[] = [
  {
    code: "SA",
    name: { en: "Saudi Arabia", ar: "السعودية" },
    flag: "🇸🇦",
    defaultCurrency: "SAR",
    dialCode: "+966",
  },
  {
    code: "AE",
    name: { en: "United Arab Emirates", ar: "الإمارات" },
    flag: "🇦🇪",
    defaultCurrency: "AED",
    dialCode: "+971",
  },
  {
    code: "KW",
    name: { en: "Kuwait", ar: "الكويت" },
    flag: "🇰🇼",
    defaultCurrency: "KWD",
    dialCode: "+965",
  },
  {
    code: "BH",
    name: { en: "Bahrain", ar: "البحرين" },
    flag: "🇧🇭",
    defaultCurrency: "BHD",
    dialCode: "+973",
  },
  {
    code: "OM",
    name: { en: "Oman", ar: "عمان" },
    flag: "🇴🇲",
    defaultCurrency: "OMR",
    dialCode: "+968",
  },
  {
    code: "QA",
    name: { en: "Qatar", ar: "قطر" },
    flag: "🇶🇦",
    defaultCurrency: "QAR",
    dialCode: "+974",
  },
  {
    code: "EG",
    name: { en: "Egypt", ar: "مصر" },
    flag: "🇪🇬",
    defaultCurrency: "EGP",
    dialCode: "+20",
  },
  {
    code: "US",
    name: { en: "United States", ar: "أمريكا" },
    flag: "🇺🇸",
    defaultCurrency: "USD",
    dialCode: "+1",
  },
];

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  SAR: { code: "SAR", symbol: "﷼", name: { en: "Saudi Riyal", ar: "ريال سعودي" }, usdRate: 3.75 },
  AED: {
    code: "AED",
    symbol: "د.إ",
    name: { en: "UAE Dirham", ar: "درهم إماراتي" },
    usdRate: 3.67,
  },
  KWD: {
    code: "KWD",
    symbol: "د.ك",
    name: { en: "Kuwaiti Dinar", ar: "دينار كويتي" },
    usdRate: 0.31,
  },
  BHD: {
    code: "BHD",
    symbol: ".د.ب",
    name: { en: "Bahraini Dinar", ar: "دينار بحريني" },
    usdRate: 0.38,
  },
  OMR: { code: "OMR", symbol: "﷼", name: { en: "Omani Rial", ar: "ريال عماني" }, usdRate: 0.38 },
  QAR: { code: "QAR", symbol: "﷼", name: { en: "Qatari Riyal", ar: "ريال قطري" }, usdRate: 3.64 },
  EGP: { code: "EGP", symbol: "ج.م", name: { en: "Egyptian Pound", ar: "جنيه مصري" }, usdRate: 48 },
  USD: { code: "USD", symbol: "$", name: { en: "US Dollar", ar: "دولار أمريكي" }, usdRate: 1 },
  EUR: { code: "EUR", symbol: "€", name: { en: "Euro", ar: "يورو" }, usdRate: 0.92 },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: { en: "British Pound", ar: "جنيه إسترليني" },
    usdRate: 0.79,
  },
};

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
