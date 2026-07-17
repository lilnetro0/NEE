import { describe, expect, it } from "vitest";
import { deriveOrderDisplayStatus, withDerivedDisplayStatus, isQuoteExpired } from "@/domain/order";
import type { CheckoutQuote } from "@/domain/order";
import { resolveCapabilities, DEFAULT_CAPABILITY_CONFIG } from "@/platform/capabilities";
import { assertNotSensitiveLocalStorageKey, maskDigitalCode, LTR_ATTR } from "@/lib/security";
import { scrubContext } from "@/lib/logger";

describe("deriveOrderDisplayStatus", () => {
  it("keeps payment success separate from fulfillment success", () => {
    expect(deriveOrderDisplayStatus("captured", "not_started", "none")).toBe("payment_confirmed");
    expect(deriveOrderDisplayStatus("captured", "processing", "none")).toBe(
      "fulfillment_processing",
    );
    expect(deriveOrderDisplayStatus("captured", "fulfilled", "none")).toBe("fulfilled");
  });

  it("prefers refund state when refund is in progress", () => {
    expect(deriveOrderDisplayStatus("captured", "fulfilled", "processing")).toBe("refund_pending");
  });

  it("withDerivedDisplayStatus recomputes displayStatus", () => {
    const order = withDerivedDisplayStatus({
      id: "o1",
      quoteId: "q1",
      createdAt: new Date().toISOString(),
      paymentStatus: "captured",
      fulfillmentStatus: "not_started",
      refundStatus: "none",
      displayStatus: "fulfilled",
      items: [],
      paymentMethod: "card",
      paymentCurrency: "SAR",
      total: 10,
      events: [],
    });
    expect(order.displayStatus).toBe("payment_confirmed");
  });
});

describe("isQuoteExpired", () => {
  it("detects expired quotes", () => {
    const quote = {
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    } as CheckoutQuote;
    expect(isQuoteExpired(quote)).toBe(true);
  });

  it("detects valid quotes", () => {
    const quote = {
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    } as CheckoutQuote;
    expect(isQuoteExpired(quote)).toBe(false);
  });
});

describe("resolveCapabilities", () => {
  it("resolves defaults and applies matching rules", () => {
    const caps = resolveCapabilities(
      { platform: "web", country: "SA", appVersion: "1.0.0" },
      {
        ...DEFAULT_CAPABILITY_CONFIG,
        rules: [
          {
            when: { countries: ["SA"] },
            set: { referralsEnabled: true },
          },
        ],
      },
    );
    expect(caps.purchasingEnabled).toBe(false);
    expect(caps.externalPaymentsEnabled).toBe(false);
    expect(caps.walletFundingEnabled).toBe(false);
    expect(caps.referralsEnabled).toBe(true);
  });
});

describe("security helpers", () => {
  it("refuses sensitive localStorage keys", () => {
    expect(() => assertNotSensitiveLocalStorageKey("access_token")).toThrow();
    expect(() => assertNotSensitiveLocalStorageKey("gift_code")).toThrow();
    expect(() => assertNotSensitiveLocalStorageKey("netro:cart")).not.toThrow();
  });

  it("masks digital codes by default", () => {
    expect(maskDigitalCode("ABCD-EFGH-IJKL")).toMatch(/IJKL$/);
    expect(maskDigitalCode("ABCD-EFGH-IJKL")).not.toContain("ABCD");
  });

  it("exposes LTR attribute for codes and IDs in RTL layouts", () => {
    expect(LTR_ATTR.dir).toBe("ltr");
  });

  it("scrubs sensitive log context", () => {
    const scrubbed = scrubContext({
      accessToken: "secret",
      otp: "123456",
      email: "a@b.com",
      phone: "+9665",
      correlationId: "req_1",
    });
    expect(scrubbed?.accessToken).toBe("[redacted]");
    expect(scrubbed?.otp).toBe("[redacted]");
    expect(scrubbed?.email).toBe("[redacted]");
    expect(scrubbed?.phone).toBe("[redacted]");
    expect(scrubbed?.correlationId).toBe("req_1");
  });
});

describe("Arabic RTL / LTR identifiers", () => {
  it("keeps identifier direction as LTR regardless of locale", () => {
    // Codes, emails, phones, Player IDs must render with dir=ltr in AR layouts.
    expect(LTR_ATTR).toEqual({ dir: "ltr" });
  });
});

describe("cart persistence policy", () => {
  it("allows only non-sensitive preference keys for cart draft", () => {
    expect(() => assertNotSensitiveLocalStorageKey("netro:cart")).not.toThrow();
    expect(() => assertNotSensitiveLocalStorageKey("netro:fav")).not.toThrow();
    expect(() => assertNotSensitiveLocalStorageKey("auth_token")).toThrow();
    expect(() => assertNotSensitiveLocalStorageKey("order_code")).toThrow();
  });
});
