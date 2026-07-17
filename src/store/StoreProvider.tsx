import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { preferences } from "@/platform/adapters";
import { CART_POLICY } from "@/platform/capabilities";
import type { CartItem } from "@/domain/cart";
import type { CurrencyCode } from "@/domain/common";

export type { CartItem } from "@/domain/cart";

export type CartError =
  { code: "topup_limit"; message: string } | { code: "mixed_cart"; message: string };

type Ctx = {
  items: CartItem[];
  add: (item: CartItem) => CartError | null;
  remove: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  /** True when the cart already contains a top-up and no more can be added. */
  hasTopUpAtLimit: boolean;
};

const StoreContext = createContext<Ctx | null>(null);

// Only non-sensitive preferences (cart draft + favorites) persist via
// the preferences adapter. Auth tokens and order codes never touch this.
const CART_KEY = "netro:cart";
const FAV_KEY = "netro:fav";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

const CURRENCY_CODES: ReadonlySet<CurrencyCode> = new Set([
  "SAR",
  "AED",
  "KWD",
  "BHD",
  "OMR",
  "QAR",
  "EGP",
  "USD",
  "EUR",
  "GBP",
]);

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCY_CODES.has(value as CurrencyCode);
}

function hasCartBase(value: Record<string, unknown>): boolean {
  return (
    typeof value.key === "string" &&
    typeof value.productId === "string" &&
    typeof value.title === "string" &&
    typeof value.regionCode === "string" &&
    typeof value.regionLabel === "string" &&
    isCurrencyCode(value.displayCurrency) &&
    typeof value.quantity === "number" &&
    typeof value.unitPrice === "number" &&
    typeof value.color === "string"
  );
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value) || !hasCartBase(value)) return false;
  if (value.kind === "gift_card") {
    return (
      isCurrencyCode(value.redemptionCurrency) &&
      isRecord(value.denomination) &&
      typeof value.denomination.id === "string" &&
      typeof value.denomination.faceValue === "number" &&
      typeof value.denomination.price === "number" &&
      typeof value.denomination.inStock === "boolean"
    );
  }
  if (value.kind === "direct_topup") {
    return (
      isRecord(value.package) &&
      typeof value.package.id === "string" &&
      typeof value.package.label === "string" &&
      typeof value.package.amount === "number" &&
      typeof value.package.price === "number" &&
      typeof value.package.inStock === "boolean" &&
      isStringRecord(value.fulfillmentFields)
    );
  }
  return false;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = preferences.get(CART_KEY);
      const f = preferences.get(FAV_KEY);
      if (c) {
        const parsed: unknown = JSON.parse(c);
        if (Array.isArray(parsed)) setItems(parsed.filter(isCartItem));
      }
      if (f) {
        const parsed: unknown = JSON.parse(f);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((id): id is string => typeof id === "string"));
        }
      }
    } catch {
      // Invalid persisted state is replaced after hydration.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    preferences.set(CART_KEY, JSON.stringify(items));
  }, [hydrated, items]);
  useEffect(() => {
    if (!hydrated) return;
    preferences.set(FAV_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  const value = useMemo<Ctx>(() => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const topUpCount = items.filter((i) => i.kind === "direct_topup").length;
    const hasTopUpAtLimit = topUpCount >= CART_POLICY.maxTopUpsPerCheckout;

    return {
      items,
      subtotal,
      count,
      hasTopUpAtLimit,
      add: (item) => {
        // Enforce: only one direct game top-up per checkout for v1.
        if (item.kind === "direct_topup") {
          const alreadyTopUp = items.filter((p) => p.kind === "direct_topup");
          if (alreadyTopUp.length >= CART_POLICY.maxTopUpsPerCheckout) {
            return {
              code: "topup_limit",
              message: "Only one game top-up per checkout is supported.",
            };
          }
        }
        setItems((prev) => {
          const existing = prev.find((p) => p.key === item.key);
          if (existing)
            return prev.map((p) =>
              p.key === item.key ? { ...p, quantity: p.quantity + item.quantity } : p,
            );
          return [...prev, item];
        });
        return null;
      },
      remove: (key) => setItems((prev) => prev.filter((p) => p.key !== key)),
      updateQty: (key, qty) =>
        setItems((prev) =>
          prev.map((p) => (p.key === key ? { ...p, quantity: Math.max(1, qty) } : p)),
        ),
      clear: () => setItems([]),
      favorites,
      toggleFavorite: (id) =>
        setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      isFavorite: (id) => favorites.includes(id),
    };
  }, [items, favorites]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
