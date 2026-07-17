/**
 * Mock temporary-quote service.
 *
 * Prices and availability come from the trusted mock catalog — never from
 * cart unit prices alone. Quotes are stored in memory, expire, and must be
 * refreshed before payment. Simulation knobs exercise price-changed and
 * out-of-stock UI paths without a real backend.
 */

import { findProduct } from "@/data/catalog";
import type { Localized } from "@/domain/common";
import type {
  CheckoutQuote,
  QuoteAvailabilityStatus,
  QuoteLine,
  QuoteWarning,
} from "@/domain/order";
import type { Product } from "@/domain/product";
import { err, ok, type Result } from "../result";
import type { CreateQuoteInput } from "../repositories/order-repository";

const QUOTE_TTL_MS = 5 * 60_000;
const TAX_RATE = 0.15;
const FEE_FLAT = 0;

/** Supported mock promo codes. */
const PROMO_CODES: Record<string, { percent: number; label: Localized }> = {
  NETRO10: {
    percent: 0.1,
    label: { en: "10% off applied", ar: "تم تطبيق خصم 10%" },
  },
  GAMER25: {
    percent: 0.25,
    label: { en: "25% gamer discount applied", ar: "تم تطبيق خصم اللاعبين 25%" },
  },
};

type StoredQuote = {
  input: CreateQuoteInput;
  quote: CheckoutQuote;
};

const quoteStore = new Map<string, StoredQuote>();

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function resolveSkuPrice(
  product: Product,
  sku: string,
): {
  unitPrice: number;
  available: boolean;
  label: string;
  redemptionCurrency?: QuoteLine["redemptionCurrency"];
} | null {
  if (product.kind === "gift_card") {
    const denom = product.denominations.find((d) => d.id === sku);
    if (!denom) return null;
    return {
      unitPrice: denom.price,
      available: product.inStock && denom.inStock,
      label: `${denom.faceValue} ${product.redemptionCurrency}`,
      redemptionCurrency: product.redemptionCurrency,
    };
  }
  const pkg = product.packages.find((p) => p.id === sku);
  if (!pkg) return null;
  return {
    unitPrice: pkg.price,
    available: product.inStock && pkg.inStock,
    label: pkg.label,
  };
}

function buildLine(
  item: CreateQuoteInput["items"][number],
  opts: { forceUnavailable?: boolean; forcePriceBump?: boolean },
): { line: QuoteLine; warnings: QuoteWarning[] } | { error: string } {
  const product = findProduct(item.productId);
  if (!product) {
    return { error: `Product '${item.productId}' was not found` };
  }

  const resolved = resolveSkuPrice(product, item.sku);
  if (!resolved) {
    return { error: `SKU '${item.sku}' was not found for product '${item.productId}'` };
  }

  let unitPrice = resolved.unitPrice;
  const available = resolved.available && !opts.forceUnavailable;
  const warnings: QuoteWarning[] = [];

  if (opts.forcePriceBump) {
    unitPrice = roundMoney(unitPrice + Math.max(1, unitPrice * 0.05));
  }

  const client = item.clientUnitPrice;
  if (client !== undefined && roundMoney(client) !== roundMoney(unitPrice)) {
    warnings.push({
      kind: "price_changed",
      productId: product.id,
      oldPrice: client,
      newPrice: unitPrice,
      message: {
        en: `${product.title.en}: price changed from ${client} to ${unitPrice}`,
        ar: `${product.title.ar}: تغيّر السعر من ${client} إلى ${unitPrice}`,
      },
    });
  }

  if (!available) {
    warnings.push({
      kind: "product_unavailable",
      productId: product.id,
      message: {
        en: `${product.title.en} is currently unavailable`,
        ar: `${product.title.ar} غير متاح حالياً`,
      },
    });
  }

  const line: QuoteLine = {
    productId: product.id,
    sku: item.sku,
    title: product.title,
    quantity: item.quantity,
    unitPrice,
    clientUnitPrice: client,
    totalPrice: roundMoney(unitPrice * item.quantity),
    currency: product.displayCurrency,
    regionCode: product.region.code,
    regionLabel: product.region.name,
    redemptionCurrency: resolved.redemptionCurrency,
    available,
  };

  return { line, warnings };
}

function availabilityFrom(
  lines: QuoteLine[],
  warnings: QuoteWarning[],
  expired: boolean,
): QuoteAvailabilityStatus {
  if (expired) return "expired";
  if (lines.some((l) => !l.available) || warnings.some((w) => w.kind === "product_unavailable")) {
    return "product_unavailable";
  }
  if (warnings.some((w) => w.kind === "price_changed")) return "price_changed";
  return "available";
}

function applyPromo(
  subtotal: number,
  code: string | undefined,
  warnings: QuoteWarning[],
): { discount: number; promoCode?: string } {
  if (!code) return { discount: 0 };
  const normalized = code.trim().toUpperCase();
  const promo = PROMO_CODES[normalized];
  if (!promo) {
    warnings.push({
      kind: "promo_invalid",
      code: normalized,
      message: {
        en: `Promo code "${normalized}" is not valid`,
        ar: `رمز الخصم "${normalized}" غير صالح`,
      },
    });
    return { discount: 0 };
  }
  const discount = roundMoney(subtotal * promo.percent);
  warnings.push({
    kind: "promo_applied",
    code: normalized,
    message: promo.label,
  });
  return { discount, promoCode: normalized };
}

export function isQuoteExpired(quote: CheckoutQuote, now = Date.now()): boolean {
  return new Date(quote.expiresAt).getTime() <= now;
}

export function getStoredQuote(quoteId: string): CheckoutQuote | null {
  return quoteStore.get(quoteId)?.quote ?? null;
}

export function clearQuoteStore(): void {
  quoteStore.clear();
}

/**
 * Builds a temporary quote from trusted catalog prices.
 */
export function buildCheckoutQuote(input: CreateQuoteInput): Result<CheckoutQuote> {
  if (input.items.length === 0) {
    return err("validation", "Quote requires at least one item");
  }

  const lines: QuoteLine[] = [];
  const warnings: QuoteWarning[] = [];
  let forceFirstUnavailable = input.simulate === "product_unavailable";
  const forcePriceBump = input.simulate === "price_changed";

  for (const item of input.items) {
    const built = buildLine(item, {
      forceUnavailable: forceFirstUnavailable,
      forcePriceBump,
    });
    if ("error" in built) return err("not_found", built.error);
    lines.push(built.line);
    warnings.push(...built.warnings);
    if (forceFirstUnavailable) forceFirstUnavailable = false;
  }

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.totalPrice, 0));
  const { discount, promoCode } = applyPromo(subtotal, input.promoCode, warnings);
  const taxable = Math.max(0, subtotal - discount);
  const tax = roundMoney(taxable * TAX_RATE);
  const fees = FEE_FLAT;
  const total = roundMoney(taxable + tax + fees);

  const now = Date.now();
  const id = `Q-${now.toString(36).toUpperCase()}`;
  const availabilityStatus = availabilityFrom(lines, warnings, false);
  const regionCode = lines[0]?.regionCode ?? input.country;

  const quote: CheckoutQuote = {
    id,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
    items: lines,
    lines,
    subtotal,
    discount,
    tax,
    vat: tax,
    fees,
    total,
    currency: input.paymentCurrency,
    paymentCurrency: input.paymentCurrency,
    displayCurrency: input.displayCurrency,
    country: input.country,
    regionCode,
    promoCode,
    availabilityStatus,
    warnings,
  };

  quoteStore.set(id, { input, quote });
  return ok(quote);
}

/**
 * Re-prices an existing quote. Optionally simulates price/stock changes.
 * Always issues a new quote ID with a fresh TTL (fresh quote required for payment).
 */
export function refreshCheckoutQuote(
  quoteId: string,
  simulate?: CreateQuoteInput["simulate"],
): Result<CheckoutQuote> {
  const stored = quoteStore.get(quoteId);
  if (!stored) return err("not_found", `Quote '${quoteId}' was not found`);

  // Drop the old quote; payment must use the fresh one.
  quoteStore.delete(quoteId);

  return buildCheckoutQuote({
    ...stored.input,
    // On refresh, client expectations become the previous trusted prices so a
    // simulated bump surfaces as price_changed.
    items: stored.quote.items.map((line) => ({
      productId: line.productId,
      sku: line.sku,
      quantity: line.quantity,
      clientUnitPrice: line.unitPrice,
      fulfillmentFields: stored.input.items.find(
        (i) => i.productId === line.productId && i.sku === line.sku,
      )?.fulfillmentFields,
    })),
    simulate: simulate ?? stored.input.simulate,
  });
}

/**
 * Validates that a quote is still payable before creating a mock order.
 */
export function assertQuotePayable(quoteId: string): Result<CheckoutQuote> {
  const stored = quoteStore.get(quoteId);
  if (!stored) return err("not_found", `Quote '${quoteId}' was not found`);

  const quote = stored.quote;
  if (isQuoteExpired(quote)) {
    const expired: CheckoutQuote = { ...quote, availabilityStatus: "expired" };
    quoteStore.set(quoteId, { input: stored.input, quote: expired });
    return err("conflict", "Quote has expired — request a fresh quote");
  }

  if (quote.availabilityStatus === "product_unavailable") {
    return err("unavailable", "One or more products are unavailable");
  }

  if (quote.availabilityStatus === "price_changed") {
    return err("conflict", "Prices changed — accept the new quote before paying");
  }

  if (quote.availabilityStatus !== "available") {
    return err("conflict", "Quote is not payable in its current state");
  }

  return ok(quote);
}
