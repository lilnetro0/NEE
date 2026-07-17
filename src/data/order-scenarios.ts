/**
 * Development mock scenarios for every significant order lifecycle state.
 * Each scenario is a full Order with payment / fulfillment / refund set so
 * `deriveOrderDisplayStatus` produces the intended display status.
 */

import type { FulfillmentStatus, Order, PaymentStatus, RefundStatus } from "@/domain/order";
import { withDerivedDisplayStatus } from "@/domain/order";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

function baseGift(
  id: string,
  overrides: {
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    refundStatus: RefundStatus;
    days: number;
    note: { en: string; ar: string };
    code?: string;
    itemFulfillment?: FulfillmentStatus;
  },
): Order {
  const displayStatus = withDerivedDisplayStatus({
    id,
    quoteId: `Q-${id}`,
    createdAt: daysAgo(overrides.days),
    paymentStatus: overrides.paymentStatus,
    fulfillmentStatus: overrides.fulfillmentStatus,
    refundStatus: overrides.refundStatus,
    items: [],
    total: 105,
    paymentCurrency: "SAR",
    paymentMethod: "Mada",
    events: [],
  }).displayStatus;

  return withDerivedDisplayStatus({
    id,
    quoteId: `Q-${id}`,
    createdAt: daysAgo(overrides.days),
    paymentStatus: overrides.paymentStatus,
    fulfillmentStatus: overrides.fulfillmentStatus,
    refundStatus: overrides.refundStatus,
    items: [
      {
        id: `${id}-1`,
        productId: "psn-100",
        productKind: "gift_card",
        title: { en: "PlayStation Store Card 100", ar: "بطاقة بلايستيشن 100" },
        regionCode: "KSA",
        denominationLabel: "100 SAR",
        quantity: 1,
        unitPrice: 105,
        fulfillmentStatus: overrides.itemFulfillment ?? overrides.fulfillmentStatus,
        code: overrides.code ? { value: overrides.code } : undefined,
      },
    ],
    total: 105,
    paymentCurrency: "SAR",
    paymentMethod: "Mada •• 4421",
    events: [
      {
        displayStatus: "awaiting_payment",
        note: { en: "Order created", ar: "تم إنشاء الطلب" },
        at: daysAgo(overrides.days),
      },
      {
        displayStatus,
        note: overrides.note,
        at: daysAgo(overrides.days),
      },
    ],
  });
}

export type OrderScenario = {
  id: string;
  /** Stable scenario key used by the dev gallery. */
  key: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  order: Order;
};

export const ORDER_SCENARIOS: OrderScenario[] = [
  {
    id: "NTR-SCEN-AWAIT",
    key: "awaiting_payment",
    title: { en: "Awaiting payment", ar: "بانتظار الدفع" },
    description: {
      en: "Payment not started yet.",
      ar: "لم يبدأ الدفع بعد.",
    },
    order: baseGift("NTR-SCEN-AWAIT", {
      paymentStatus: "not_started",
      fulfillmentStatus: "not_started",
      refundStatus: "none",
      days: 0,
      note: { en: "Awaiting payment", ar: "بانتظار الدفع" },
    }),
  },
  {
    id: "NTR-SCEN-PAYPROC",
    key: "payment_processing",
    title: { en: "Payment processing", ar: "جاري معالجة الدفع" },
    description: {
      en: "Customer is completing 3-D Secure / wallet auth.",
      ar: "العميل يُكمل المصادقة ثلاثية الأبعاد.",
    },
    order: baseGift("NTR-SCEN-PAYPROC", {
      paymentStatus: "processing",
      fulfillmentStatus: "not_started",
      refundStatus: "none",
      days: 0,
      note: { en: "Payment processing", ar: "جاري معالجة الدفع" },
    }),
  },
  {
    id: "NTR-SCEN-PAYOK",
    key: "payment_confirmed",
    title: { en: "Payment confirmed", ar: "تم تأكيد الدفع" },
    description: {
      en: "Payment authorized/captured — delivery has not finished.",
      ar: "تم تفويض/تحصيل الدفع — التسليم لم يكتمل.",
    },
    order: baseGift("NTR-SCEN-PAYOK", {
      paymentStatus: "captured",
      fulfillmentStatus: "not_started",
      refundStatus: "none",
      days: 0,
      note: {
        en: "Payment confirmed — fulfillment not started",
        ar: "تم تأكيد الدفع — لم يبدأ التنفيذ",
      },
    }),
  },
  {
    id: "NTR-SCEN-FULFILL",
    key: "fulfillment_processing",
    title: { en: "Fulfillment processing", ar: "جاري التنفيذ" },
    description: {
      en: "Supplier delivery in progress.",
      ar: "جاري التسليم عبر المورّد.",
    },
    order: baseGift("NTR-SCEN-FULFILL", {
      paymentStatus: "captured",
      fulfillmentStatus: "processing",
      refundStatus: "none",
      days: 0,
      note: { en: "Fulfilling with supplier", ar: "جاري التنفيذ مع المورّد" },
    }),
  },
  {
    id: "NTR-SCEN-DONE",
    key: "fulfilled",
    title: { en: "Fulfilled", ar: "تم التسليم" },
    description: {
      en: "Payment captured and code delivered.",
      ar: "تم التحصيل وتسليم الكود.",
    },
    order: baseGift("NTR-SCEN-DONE", {
      paymentStatus: "captured",
      fulfillmentStatus: "fulfilled",
      refundStatus: "none",
      days: 1,
      code: "AAAA-BBBB-CCCC-DDDD",
      note: { en: "Code delivered", ar: "تم تسليم الكود" },
    }),
  },
  {
    id: "NTR-SCEN-PARTIAL",
    key: "partially_fulfilled",
    title: { en: "Partially fulfilled", ar: "تسليم جزئي" },
    description: {
      en: "Some lines delivered; remainder pending refund/credit.",
      ar: "تم تسليم بعض العناصر؛ الباقي بانتظار الاسترداد.",
    },
    order: withDerivedDisplayStatus({
      id: "NTR-SCEN-PARTIAL",
      quoteId: "Q-NTR-SCEN-PARTIAL",
      createdAt: daysAgo(2),
      paymentStatus: "captured",
      fulfillmentStatus: "partially_fulfilled",
      refundStatus: "none",
      items: [
        {
          id: "NTR-SCEN-PARTIAL-1",
          productId: "psn-100",
          productKind: "gift_card",
          title: { en: "PlayStation Store Card 100", ar: "بطاقة بلايستيشن 100" },
          regionCode: "KSA",
          denominationLabel: "100 SAR",
          quantity: 1,
          unitPrice: 105,
          fulfillmentStatus: "fulfilled",
          code: { value: "PART-OKAY-CODE-0001" },
        },
        {
          id: "NTR-SCEN-PARTIAL-2",
          productId: "steam-100",
          productKind: "gift_card",
          title: { en: "Steam Wallet 50", ar: "محفظة ستيم 50" },
          regionCode: "GLOBAL",
          denominationLabel: "50 SAR",
          quantity: 1,
          unitPrice: 50,
          fulfillmentStatus: "failed",
        },
      ],
      total: 155,
      paymentCurrency: "SAR",
      paymentMethod: "Visa •• 8871",
      events: [
        {
          displayStatus: "payment_confirmed",
          note: { en: "Payment captured", ar: "تم تحصيل الدفع" },
          at: daysAgo(2),
        },
        {
          displayStatus: "partially_fulfilled",
          note: { en: "Partial delivery", ar: "تسليم جزئي" },
          at: daysAgo(2),
        },
      ],
    }),
  },
  {
    id: "NTR-SCEN-FAIL",
    key: "fulfillment_failed",
    title: { en: "Fulfillment failed", ar: "فشل التنفيذ" },
    description: {
      en: "Supplier could not deliver after payment.",
      ar: "تعذّر على المورّد التسليم بعد الدفع.",
    },
    order: baseGift("NTR-SCEN-FAIL", {
      paymentStatus: "captured",
      fulfillmentStatus: "failed",
      refundStatus: "none",
      days: 3,
      note: { en: "Supplier fulfillment failed", ar: "فشل تنفيذ المورّد" },
    }),
  },
  {
    id: "NTR-SCEN-REVIEW",
    key: "manual_review",
    title: { en: "Manual review", ar: "مراجعة يدوية" },
    description: {
      en: "Held for risk / supplier review.",
      ar: "معلّق للمراجعة الأمنية أو مراجعة المورّد.",
    },
    order: baseGift("NTR-SCEN-REVIEW", {
      paymentStatus: "captured",
      fulfillmentStatus: "manual_review",
      refundStatus: "none",
      days: 4,
      note: { en: "Under manual review", ar: "قيد المراجعة اليدوية" },
    }),
  },
  {
    id: "NTR-SCEN-REFPEND",
    key: "refund_pending",
    title: { en: "Refund pending", ar: "استرداد قيد الانتظار" },
    description: {
      en: "Refund requested and being processed.",
      ar: "تم طلب الاسترداد وهو قيد المعالجة.",
    },
    order: baseGift("NTR-SCEN-REFPEND", {
      paymentStatus: "captured",
      fulfillmentStatus: "failed",
      refundStatus: "processing",
      days: 5,
      note: { en: "Refund processing", ar: "جاري معالجة الاسترداد" },
    }),
  },
  {
    id: "NTR-SCEN-REFDONE",
    key: "refunded",
    title: { en: "Refunded", ar: "تم الاسترداد" },
    description: {
      en: "Refund completed to original method or store credit.",
      ar: "اكتمل الاسترداد لطريقة الدفع أو رصيد المتجر.",
    },
    order: baseGift("NTR-SCEN-REFDONE", {
      paymentStatus: "refunded",
      fulfillmentStatus: "failed",
      refundStatus: "completed",
      days: 6,
      note: { en: "Refund completed", ar: "اكتمل الاسترداد" },
    }),
  },
  {
    id: "NTR-SCEN-CANCEL",
    key: "cancelled",
    title: { en: "Cancelled", ar: "ملغى" },
    description: {
      en: "Payment failed or order cancelled before capture.",
      ar: "فشل الدفع أو أُلغي الطلب قبل التحصيل.",
    },
    order: baseGift("NTR-SCEN-CANCEL", {
      paymentStatus: "failed",
      fulfillmentStatus: "not_started",
      refundStatus: "none",
      days: 7,
      note: { en: "Payment failed — order cancelled", ar: "فشل الدفع — أُلغي الطلب" },
    }),
  },
  {
    id: "NTR-SCEN-QUEUED",
    key: "fulfillment_queued",
    title: { en: "Fulfillment queued", ar: "في قائمة التنفيذ" },
    description: {
      en: "Payment captured; job queued with supplier.",
      ar: "تم التحصيل؛ الطلب في قائمة المورّد.",
    },
    order: baseGift("NTR-SCEN-QUEUED", {
      paymentStatus: "captured",
      fulfillmentStatus: "queued",
      refundStatus: "none",
      days: 0,
      note: { en: "Queued for fulfillment", ar: "في قائمة التنفيذ" },
    }),
  },
];

export const scenarioOrders: Order[] = ORDER_SCENARIOS.map((s) => s.order);

export function findScenario(id: string): OrderScenario | undefined {
  return ORDER_SCENARIOS.find((s) => s.id === id || s.key === id);
}
