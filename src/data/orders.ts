import type { Order } from "@/domain/order";
import { withDerivedDisplayStatus } from "@/domain/order";
import type { Notification } from "@/domain/notification";
import { scenarioOrders } from "./order-scenarios";

export type { OrderDisplayStatus as OrderStatus } from "@/domain/order";
export type { Notification as NotificationItem } from "@/domain/notification";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

/** Primary catalog of customer-facing seed orders (plus all lifecycle scenarios). */
const seedOrders: Order[] = [
  withDerivedDisplayStatus({
    id: "NTR-2810391",
    quoteId: "Q-NTR-2810391",
    createdAt: daysAgo(1),
    paymentStatus: "captured",
    fulfillmentStatus: "fulfilled",
    refundStatus: "none",
    items: [
      {
        id: "NTR-2810391-1",
        productId: "psn-100",
        productKind: "gift_card",
        title: { en: "PlayStation Store Card 100", ar: "بطاقة بلايستيشن 100" },
        regionCode: "KSA",
        denominationLabel: "100 SAR",
        quantity: 1,
        unitPrice: 105,
        fulfillmentStatus: "fulfilled",
        code: { value: "AAAA-BBBB-CCCC-DDDD" },
      },
    ],
    total: 105,
    paymentCurrency: "SAR",
    paymentMethod: "Mada •• 4421",
    events: [
      {
        displayStatus: "payment_confirmed",
        note: { en: "Payment captured", ar: "تم تحصيل الدفع" },
        at: daysAgo(1),
      },
      {
        displayStatus: "fulfillment_processing",
        note: { en: "Fulfillment started", ar: "بدأ التنفيذ" },
        at: daysAgo(1),
      },
      {
        displayStatus: "fulfilled",
        note: { en: "Code delivered", ar: "تم تسليم الكود" },
        at: daysAgo(1),
      },
    ],
  }),
  withDerivedDisplayStatus({
    id: "NTR-2810127",
    quoteId: "Q-NTR-2810127",
    createdAt: daysAgo(3),
    paymentStatus: "captured",
    fulfillmentStatus: "fulfilled",
    refundStatus: "none",
    items: [
      {
        id: "NTR-2810127-1",
        productId: "pubg-uc",
        productKind: "direct_topup",
        title: { en: "PUBG Mobile 660 UC", ar: "ببجي 660 UC" },
        regionCode: "GLOBAL",
        packageLabel: "660 UC",
        fulfillmentFields: { playerId: "5124782910" },
        quantity: 1,
        unitPrice: 42,
        fulfillmentStatus: "fulfilled",
        transactionId: "TXN-2810127",
      },
    ],
    total: 42,
    paymentCurrency: "SAR",
    paymentMethod: "Apple Pay",
    events: [
      {
        displayStatus: "payment_confirmed",
        note: { en: "Payment captured", ar: "تم تحصيل الدفع" },
        at: daysAgo(3),
      },
      {
        displayStatus: "fulfilled",
        note: { en: "Top-up delivered", ar: "تم الشحن" },
        at: daysAgo(3),
      },
    ],
  }),
  withDerivedDisplayStatus({
    id: "NTR-2809912",
    quoteId: "Q-NTR-2809912",
    createdAt: daysAgo(5),
    paymentStatus: "captured",
    fulfillmentStatus: "manual_review",
    refundStatus: "none",
    items: [
      {
        id: "NTR-2809912-1",
        productId: "steam-100",
        productKind: "gift_card",
        title: { en: "Steam Wallet 50", ar: "محفظة ستيم 50" },
        regionCode: "GLOBAL",
        denominationLabel: "50 SAR",
        quantity: 2,
        unitPrice: 50,
        fulfillmentStatus: "manual_review",
      },
    ],
    total: 100,
    paymentCurrency: "SAR",
    paymentMethod: "Visa •• 8871",
    events: [
      {
        displayStatus: "payment_confirmed",
        note: { en: "Payment captured", ar: "تم تحصيل الدفع" },
        at: daysAgo(5),
      },
      {
        displayStatus: "manual_review",
        note: { en: "Under review", ar: "قيد المراجعة" },
        at: daysAgo(5),
      },
    ],
  }),
  withDerivedDisplayStatus({
    id: "NTR-2807711",
    quoteId: "Q-NTR-2807711",
    createdAt: daysAgo(9),
    paymentStatus: "failed",
    fulfillmentStatus: "not_started",
    refundStatus: "none",
    items: [
      {
        id: "NTR-2807711-1",
        productId: "netflix-100",
        productKind: "gift_card",
        title: { en: "Netflix 100", ar: "نتفليكس 100" },
        regionCode: "KSA",
        denominationLabel: "100 SAR",
        quantity: 1,
        unitPrice: 105,
        fulfillmentStatus: "not_started",
      },
    ],
    total: 105,
    paymentCurrency: "SAR",
    paymentMethod: "STC Pay",
    events: [
      {
        displayStatus: "payment_processing",
        note: { en: "Payment started", ar: "بدأ الدفع" },
        at: daysAgo(9),
      },
      {
        displayStatus: "cancelled",
        note: { en: "Payment failed", ar: "فشل الدفع" },
        at: daysAgo(9),
      },
    ],
  }),
];

/** Deduplicate by id — scenarios override seeds when ids collide (they don't). */
export const orders: Order[] = (() => {
  const map = new Map<string, Order>();
  for (const o of seedOrders) map.set(o.id, o);
  for (const o of scenarioOrders) map.set(o.id, o);
  return [...map.values()];
})();

export const notifications: Notification[] = [
  {
    id: "n1",
    title: { en: "Order delivered", ar: "تم تسليم الطلب" },
    body: { en: "Your PSN code is ready.", ar: "كود PSN جاهز." },
    time: daysAgo(0),
    read: false,
    type: "order",
  },
  {
    id: "n2",
    title: { en: "Flash sale ⚡", ar: "عرض خاطف ⚡" },
    body: { en: "25% off Spotify Premium today.", ar: "خصم 25% على سبوتيفاي اليوم." },
    time: daysAgo(1),
    read: false,
    type: "promo",
  },
  {
    id: "n3",
    title: { en: "New login detected", ar: "تسجيل دخول جديد" },
    body: { en: "iPhone 15 · Riyadh.", ar: "آيفون 15 · الرياض." },
    time: daysAgo(2),
    read: true,
    type: "security",
  },
];
