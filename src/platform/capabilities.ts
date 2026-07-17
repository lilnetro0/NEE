import type { PlatformKind } from "./contracts";

/**
 * Local market/platform capability configuration.
 *
 * UI must go through `resolveCapabilities()` / `useCapabilities()`.
 * Remote configuration is intentionally not wired yet — swap
 * `DEFAULT_CAPABILITY_CONFIG` later without changing screens.
 */

export type Platform = PlatformKind;

export type ProductType = "gift_card" | "direct_topup";

export type CapabilityId =
  | "purchasingEnabled"
  | "externalPaymentsEnabled"
  | "giftCardPurchaseEnabled"
  | "directGameTopUpEnabled"
  | "walletFundingEnabled"
  | "storeCreditEnabled"
  | "savedPaymentMethodsEnabled"
  | "referralsEnabled"
  | "promotionsEnabled";

export type Capabilities = Readonly<Record<CapabilityId, boolean>>;

export type CapabilityContext = {
  platform: Platform;
  /** ISO 3166-1 alpha-2 country code (e.g. "SA"). */
  country: string;
  appVersion: string;
  productType?: ProductType;
};

export type CapabilityRule = {
  /** All listed conditions must match for the rule to apply. */
  when?: {
    platforms?: readonly Platform[];
    countries?: readonly string[];
    /** Inclusive minimum app version (major.minor.patch). */
    minAppVersion?: string;
    productTypes?: readonly ProductType[];
  };
  set: Partial<Capabilities>;
};

export type CapabilityConfig = {
  defaults: Capabilities;
  rules: readonly CapabilityRule[];
};

/** Production defaults — purchasing stays off until Moyasar (or another PSP) is wired. */
export const DEFAULT_CAPABILITY_CONFIG: CapabilityConfig = {
  defaults: {
    purchasingEnabled: false,
    externalPaymentsEnabled: false,
    giftCardPurchaseEnabled: false,
    directGameTopUpEnabled: false,
    walletFundingEnabled: false,
    storeCreditEnabled: true,
    savedPaymentMethodsEnabled: false,
    referralsEnabled: false,
    promotionsEnabled: true,
  },
  rules: [
    // When payment integration ships, enable via remote config / env-driven rules, e.g.:
    // { set: { purchasingEnabled: true, externalPaymentsEnabled: true, giftCardPurchaseEnabled: true, directGameTopUpEnabled: true, savedPaymentMethodsEnabled: true } },
  ],
};

export const DEFAULT_MARKET_COUNTRY = "SA";

export type PaymentRailCapabilities = Readonly<{
  applePayEnabled: boolean;
  stcPayEnabled: boolean;
  madaEnabled: boolean;
  visaEnabled: boolean;
}>;

export function compareAppVersions(a: string, b: string): number {
  const parse = (value: string) =>
    value
      .split(".")
      .map((part) => Number.parseInt(part.replace(/[^\d]/g, ""), 10) || 0)
      .concat([0, 0, 0])
      .slice(0, 3);
  const left = parse(a);
  const right = parse(b);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function ruleMatches(rule: CapabilityRule, ctx: CapabilityContext): boolean {
  const when = rule.when;
  if (!when) return true;
  if (when.platforms && !when.platforms.includes(ctx.platform)) return false;
  if (when.countries && !when.countries.includes(ctx.country)) return false;
  if (when.productTypes && (!ctx.productType || !when.productTypes.includes(ctx.productType))) {
    return false;
  }
  if (when.minAppVersion && compareAppVersions(ctx.appVersion, when.minAppVersion) < 0) {
    return false;
  }
  return true;
}

/**
 * Pure capability resolution. Safe to unit-test without a framework.
 */
export function resolveCapabilities(
  ctx: CapabilityContext,
  config: CapabilityConfig = DEFAULT_CAPABILITY_CONFIG,
): Capabilities {
  const flags: Record<CapabilityId, boolean> = { ...config.defaults };

  for (const rule of config.rules) {
    if (!ruleMatches(rule, ctx)) continue;
    Object.assign(flags, rule.set);
  }

  return flags;
}

export function isCapabilityEnabled(
  id: CapabilityId,
  ctx: CapabilityContext,
  config: CapabilityConfig = DEFAULT_CAPABILITY_CONFIG,
): boolean {
  return resolveCapabilities(ctx, config)[id];
}

/**
 * Product purchase requires the master purchasing flag plus the matching
 * product-type flag.
 */
export function canPurchaseProduct(caps: Capabilities, productType: ProductType): boolean {
  if (!caps.purchasingEnabled) return false;
  if (productType === "gift_card") return caps.giftCardPurchaseEnabled;
  return caps.directGameTopUpEnabled;
}

/**
 * Checkout payment rails. Always subordinated to `externalPaymentsEnabled`.
 */
export function resolvePaymentRails(
  ctx: CapabilityContext,
  caps: Capabilities = resolveCapabilities(ctx),
): PaymentRailCapabilities {
  if (!caps.externalPaymentsEnabled) {
    return {
      applePayEnabled: false,
      stcPayEnabled: false,
      madaEnabled: false,
      visaEnabled: false,
    };
  }

  return {
    applePayEnabled: ctx.platform !== "android",
    stcPayEnabled: ctx.country === "SA",
    madaEnabled: ctx.country === "SA",
    visaEnabled: true,
  };
}

// ============ App-wide policies ============

export const CART_POLICY = {
  /** First version: only one direct game top-up per checkout. */
  maxTopUpsPerCheckout: 1,
  /** Gift-card carts allow multiple items; suppliers can partially fail. */
  giftCardPartialFailureAllowed: true,
};
