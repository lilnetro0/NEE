/**
 * Typed API service placeholders.
 *
 * These functions return Promises that today resolve against mock data.
 * When the backend arrives, only these bodies change — UI code keeps its
 * contract with the domain types. Every service returns a plain DTO; no
 * SDK client leaks through.
 *
 * Loading / empty / error handling is the caller's responsibility; see
 * `<AsyncState />` for the standard wrapper.
 */

import type { Product, AccountVerification } from "@/domain/product";
import type { CurrencyCode } from "@/domain/common";
import type { FulfillmentStatus, Order, Quote, StoreCredit } from "@/domain/order";
import type { FieldValues } from "@/domain/forms";
import type { NewSupportTicket } from "@/domain/support";
import { adaptLegacyCatalog } from "@/data/catalog";
import { mockOrders } from "@/data/orders-adapter";

/** Simulated latency for realism. */
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ============ Products ============

export const productsApi = {
  async list(params?: { categoryId?: string; brandId?: string; q?: string }): Promise<Product[]> {
    await wait(120);
    const all = adaptLegacyCatalog();
    return all.filter((p: Product) => {
      if (params?.categoryId && p.categoryId !== params.categoryId) return false;
      if (params?.brandId && p.brandId !== params.brandId) return false;
      if (params?.q) {
        const q = params.q.toLowerCase();
        return p.title.en.toLowerCase().includes(q) || p.title.ar.includes(q);
      }
      return true;
    });
  },

  async get(id: string): Promise<Product | null> {
    await wait(100);
    return adaptLegacyCatalog().find((p: Product) => p.id === id) ?? null;
  },

  async verifyAccount(productId: string, values: FieldValues): Promise<AccountVerification> {
    await wait(400);
    // Mock: require at least one non-empty value.
    if (!Object.values(values).some((v) => v && v.trim())) {
      return {
        ok: false,
        reason: "invalid_input",
        message: { en: "Please fill required fields", ar: "يرجى ملء الحقول المطلوبة" },
      };
    }
    return {
      ok: true,
      nickname: "NetroPlayer",
      server: values.server ?? "Asia",
      region: "Global",
    };
  },
};

// ============ Quotes ============

export const quotesApi = {
  async create(input: {
    items: { productId: string; sku: string; quantity: number; fulfillmentFields?: FieldValues }[];
    country: string;
    paymentCurrency: CurrencyCode;
    displayCurrency: CurrencyCode;
  }): Promise<Quote> {
    await wait(200);
    const now = Date.now();
    return {
      id: `Q-${now.toString(36).toUpperCase()}`,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 5 * 60_000).toISOString(),
      lines: input.items.map((it) => ({
        productId: it.productId,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: 50,
        totalPrice: 50 * it.quantity,
        currency: input.displayCurrency,
        regionCode: "GLOBAL",
      })),
      subtotal: 50,
      vat: 7.5,
      fees: 0,
      total: 57.5,
      paymentCurrency: input.paymentCurrency,
      displayCurrency: input.displayCurrency,
      warnings: [],
    };
  },

  async refresh(quoteId: string): Promise<Quote> {
    await wait(200);
    return this.create({
      items: [],
      country: "SA",
      paymentCurrency: "SAR",
      displayCurrency: "SAR",
    }).then((q) => ({ ...q, id: quoteId }));
  },
};

// ============ Orders ============

export const ordersApi = {
  async list(): Promise<Order[]> {
    await wait(150);
    return mockOrders();
  },

  async get(id: string): Promise<Order | null> {
    await wait(120);
    return mockOrders().find((o: Order) => o.id === id) ?? null;
  },

  async create(input: { quoteId: string; paymentMethod: string }): Promise<Order> {
    await wait(300);
    const list = mockOrders();
    return {
      ...list[0],
      id: `NTR-${Date.now().toString(36).toUpperCase()}`,
      quoteId: input.quoteId,
      paymentMethod: input.paymentMethod,
    };
  },

  /** Reveal a sensitive code after a fresh re-authentication. */
  async revealCode(orderId: string, itemIndex: number, reauthToken: string): Promise<string> {
    await wait(250);
    if (!reauthToken) throw new Error("REAUTH_REQUIRED");
    const order = mockOrders().find((o: Order) => o.id === orderId);
    const item = order?.items[itemIndex];
    return item?.productKind === "gift_card"
      ? (item.code?.value ?? "XXXX-XXXX-XXXX")
      : "XXXX-XXXX-XXXX";
  },
};

// ============ Store Credit ============

export const creditApi = {
  async get(): Promise<StoreCredit> {
    await wait(120);
    return {
      balance: 42.5,
      currency: "SAR",
      transactions: [
        {
          id: "t1",
          kind: "refund_credit",
          amount: 25,
          currency: "SAR",
          createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
          description: { en: "Refund · NTR-2810391", ar: "استرداد · NTR-2810391" },
        },
        {
          id: "t2",
          kind: "promo_credit",
          amount: 20,
          currency: "SAR",
          createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
          description: { en: "Welcome bonus", ar: "مكافأة ترحيبية" },
        },
        {
          id: "t3",
          kind: "purchase",
          amount: -2.5,
          currency: "SAR",
          createdAt: new Date(Date.now() - 8 * 86400_000).toISOString(),
          description: { en: "Order NTR-2810127", ar: "طلب NTR-2810127" },
        },
      ],
    };
  },
};

// ============ Auth / sensitive session actions ============

export const authApi = {
  async reauth(_password: string): Promise<{ token: string; expiresAt: string }> {
    await wait(300);
    return {
      token: "reauth-" + Date.now(),
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    };
  },
  async listSessions(): Promise<
    { id: string; device: string; location: string; lastActive: string; current: boolean }[]
  > {
    await wait(150);
    return [
      {
        id: "s1",
        device: "iPhone 15 Pro",
        location: "Riyadh, SA",
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: "s2",
        device: "MacBook Pro",
        location: "Riyadh, SA",
        lastActive: new Date(Date.now() - 3600_000).toISOString(),
        current: false,
      },
    ];
  },
  async revokeSession(_id: string): Promise<void> {
    await wait(200);
  },
  async deleteAccount(_password: string): Promise<void> {
    await wait(400);
  },
  async requestEmailChange(_email: string): Promise<void> {
    await wait(200);
  },
  async verifyEmailChange(code: string): Promise<void> {
    await wait(200);
    if (code.length !== 6) throw new Error("INVALID_CODE");
  },
  async requestPhoneChange(_phone: string): Promise<void> {
    await wait(200);
  },
  async verifyPhoneChange(code: string): Promise<void> {
    await wait(200);
    if (code.length !== 6) throw new Error("INVALID_CODE");
  },
};

// ============ Fulfillment polling ============

export const fulfillmentApi = {
  async poll(orderId: string): Promise<{ state: FulfillmentStatus }> {
    await wait(400);
    void orderId;
    return { state: "fulfilled" };
  },
};

// ============ Support ============

export type { SupportReason } from "@/domain/support";

export const supportApi = {
  async submit(_ticket: NewSupportTicket): Promise<{ id: string }> {
    await wait(300);
    return { id: `T-${Date.now().toString(36).toUpperCase()}` };
  },
};
