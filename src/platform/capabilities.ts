/**
 * Platform capability flags.
 *
 * Every feature that touches money, external providers or platform-restricted
 * APIs is gated by a flag here. Flags are evaluated against:
 *   - platform  (web | ios | android)
 *   - country   (customer country)
 *   - appVersion
 *   - productKind (gift_card | top_up)
 *
 * Backend can later replace `resolveCapabilities()` with a server-driven
 * config fetch; UI consumers should not import the flags map directly.
 */

export type Platform = "web" | "ios" | "android";

export type CapabilityContext = {
  platform: Platform;
  country: string;
  appVersion: string;
  productKind?: "gift_card" | "top_up";
};

export type CapabilityFlag =
  | "purchasing"
  | "store_credit_pay"
  | "external_payments"
  | "gift_card_purchase"
  | "direct_topup"
  | "account_verification"
  | "apple_pay"
  | "stc_pay"
  | "mada"
  | "visa"
  | "biometric_reveal";

/** Baseline defaults; overridden per-context in `resolveCapabilities()`. */
const DEFAULTS: Record<CapabilityFlag, boolean> = {
  purchasing: true,
  store_credit_pay: true,
  external_payments: true,
  gift_card_purchase: true,
  direct_topup: true,
  account_verification: true,
  apple_pay: true,
  stc_pay: true,
  mada: true,
  visa: true,
  biometric_reveal: false,
};

export function resolveCapabilities(ctx: CapabilityContext): Record<CapabilityFlag, boolean> {
  const flags = { ...DEFAULTS };

  // Apple Pay is iOS / web-on-safari only. Assume web supports it when Safari
  // detects it; keep true for now and gate at usage time.
  if (ctx.platform === "android") flags.apple_pay = false;

  // STC Pay & Mada are KSA-only.
  if (ctx.country !== "SA") {
    flags.stc_pay = false;
    flags.mada = false;
  }

  // Biometric reveal only makes sense on native.
  flags.biometric_reveal = ctx.platform !== "web";

  // Product-kind gates. Backend can flip these per SKU later.
  if (ctx.productKind === "top_up") {
    // No policy change today, but this hook exists.
  }

  return flags;
}

export function isEnabled(flag: CapabilityFlag, ctx: CapabilityContext): boolean {
  return resolveCapabilities(ctx)[flag];
}

// ============ App-wide policies ============

export const CART_POLICY = {
  /** First version: only one direct game top-up per checkout. */
  maxTopUpsPerCheckout: 1,
  /** Gift-card carts allow multiple items; suppliers can partially fail. */
  giftCardPartialFailureAllowed: true,
};
