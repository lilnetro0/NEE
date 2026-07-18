import type { CurrencyCode } from "@/domain/common";
import type { Brand, Category } from "@/domain/catalog";
import type { DynamicTopUpField } from "@/domain/forms";
import type {
  DirectTopUpProduct,
  GiftCardProduct,
  Product,
  ProductDenomination,
  TopUpPackage,
} from "@/domain/product";
import type { Region } from "@/domain/regions";
import type { User } from "@/domain/user";
import type { Notification } from "@/domain/notification";
import type { Promotion } from "@/domain/promotion";
import type {
  CheckoutQuote,
  FulfillmentStatus,
  Order,
  PaymentStatus,
  QuoteLine,
  QuoteWarning,
  RefundStatus,
  StoreCredit,
} from "@/domain/order";
import { withDerivedDisplayStatus } from "@/domain/order";
import type { SupportTicket } from "@/domain/support";
import type { Database, Json } from "@/types/database";
import type { AuthSessionTokens } from "@/domain/auth";
import type { Session } from "@supabase/supabase-js";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type RegionRow = Database["public"]["Tables"]["regions"]["Row"];
type DenomRow = Database["public"]["Tables"]["denominations"]["Row"];
type PackageRow = Database["public"]["Tables"]["topup_packages"]["Row"];
type FieldRow = Database["public"]["Tables"]["product_required_fields"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type QuoteRow = Database["public"]["Tables"]["checkout_quotes"]["Row"];
type QuoteItemRow = Database["public"]["Tables"]["checkout_quote_items"]["Row"];

function localized(en: string, ar: string) {
  return { en, ar };
}

function asRegion(code: string, row?: RegionRow): Region {
  return {
    code: code.toUpperCase(),
    name: row ? localized(row.name_en, row.name_ar) : { en: code, ar: code },
    currencyCode: row ? asCurrency(row.currency_code) : undefined,
  };
}

function asCurrency(code: string): CurrencyCode {
  return code as CurrencyCode;
}

export function mapProfileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    displayName: row.display_name || "User",
    email: row.email ?? "",
    phone: row.phone ?? undefined,
    countryCode: row.country_code,
    preferredCurrency: asCurrency(row.preferred_currency),
    preferredLocale: row.preferred_locale === "ar" ? "ar" : "en",
    createdAt: row.created_at,
  };
}

export function mapSessionTokens(session: Session): AuthSessionTokens {
  const expiresAt = new Date((session.expires_at ?? 0) * 1000).toISOString();
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt,
    userId: session.user.id,
  };
}

export function mapProduct(
  row: ProductRow,
  denominations: DenomRow[],
  packages: PackageRow[],
  fields: FieldRow[],
  region?: RegionRow,
): Product {
  const base = {
    id: row.id,
    brandId: row.brand_id,
    categoryId: row.category_id,
    title: localized(row.title_en, row.title_ar),
    subtitle:
      row.subtitle_en || row.subtitle_ar
        ? localized(row.subtitle_en ?? "", row.subtitle_ar ?? "")
        : undefined,
    description: localized(row.description_en, row.description_ar),
    color: row.color,
    rating: Number(row.rating),
    reviewsCount: row.reviews_count,
    inStock: row.in_stock,
    tags: row.tags,
    fromPrice: Number(row.from_price),
    compareAt: row.compare_at != null ? Number(row.compare_at) : undefined,
    displayCurrency: asCurrency(row.display_currency),
  };

  const payload = (row.payload ?? {}) as Record<string, unknown>;

  if (row.kind === "gift_card") {
    const dens: ProductDenomination[] = denominations
      .filter((d) => d.product_id === row.id)
      .map((d) => ({
        id: d.id,
        faceValue: Number(d.face_value),
        price: Number(d.price),
        inStock: d.in_stock,
      }));
    const gift: GiftCardProduct = {
      ...base,
      kind: "gift_card",
      region: asRegion(row.region_id || row.region_code, region),
      redemptionCurrency: asCurrency(
        String((payload.redemptionCurrency as string | undefined) ?? row.display_currency),
      ),
      denominations: dens,
      pinDelivery: (payload.pinDelivery as GiftCardProduct["pinDelivery"]) ?? {
        method: "screen",
        instant: true,
      },
      redemptionInstructions:
        (payload.redemptionInstructions as GiftCardProduct["redemptionInstructions"]) ??
        localized("", ""),
      restrictions: payload.restrictions as GiftCardProduct["restrictions"],
    };
    return gift;
  }

  const pkgs: TopUpPackage[] = packages
    .filter((p) => p.product_id === row.id)
    .map((p) => ({
      id: p.id,
      label: p.label,
      amount: Number(p.amount),
      price: Number(p.price),
      inStock: p.in_stock,
      bonus: p.bonus_en || p.bonus_ar ? localized(p.bonus_en ?? "", p.bonus_ar ?? "") : undefined,
    }));

  const requiredFields: DynamicTopUpField[] = fields
    .filter((f) => f.product_id === row.id)
    .map((f) => f.field_schema as unknown as DynamicTopUpField);

  const game = (payload.game as DirectTopUpProduct["game"]) ?? {
    id: row.brand_id,
    name: localized(row.title_en, row.title_ar),
  };
  const validation = (payload.validation as DirectTopUpProduct["validation"]) ?? {
    accountLookup: "unsupported" as const,
    confirmationRequired: true,
  };

  const topup: DirectTopUpProduct = {
    ...base,
    kind: "direct_topup",
    game,
    region: asRegion(row.region_id || row.region_code, region),
    packages: pkgs,
    requiredFields,
    validation,
    fulfillmentMode:
      (payload.fulfillmentMode as DirectTopUpProduct["fulfillmentMode"]) ?? "automatic",
    fulfillmentEstimateMinutes: Number(payload.fulfillmentEstimateMinutes ?? 5),
  };
  return topup;
}

export function mapCategory(row: Database["public"]["Tables"]["categories"]["Row"]): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: localized(row.name_en, row.name_ar),
    icon: "•",
    color: "#64748b",
    imagePath: row.image_path ?? undefined,
  };
}

export function mapBrand(row: Database["public"]["Tables"]["brands"]["Row"]): Brand {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name_en,
    localizedName: localized(row.name_en, row.name_ar),
    color: row.color,
    logo: "",
    imagePath: row.image_path ?? undefined,
    primaryCategoryId: row.primary_category_id ?? undefined,
  };
}

export function mapRegion(row: RegionRow): Region {
  return asRegion(row.code, row);
}

export function mapNotification(
  row: Database["public"]["Tables"]["notifications"]["Row"],
): Notification {
  return {
    id: row.id,
    title: localized(row.title_en, row.title_ar),
    body: localized(row.body_en, row.body_ar),
    time: row.created_at,
    read: row.read,
    type: row.type,
  };
}

export function mapPromotion(row: Database["public"]["Tables"]["promotions"]["Row"]): Promotion {
  return {
    id: row.id,
    code: row.code,
    title: localized(row.title_en, row.title_ar),
    expiresLabel: localized(row.expires_label_en, row.expires_label_ar),
    expiresAt: row.expires_at ?? undefined,
  };
}

export function mapStoreCredit(
  row: Database["public"]["Tables"]["store_credits"]["Row"],
): StoreCredit {
  return {
    balance: Number(row.balance),
    currency: asCurrency(row.currency),
    transactions: [],
  };
}

export function mapDbPaymentToDomain(status: OrderRow["payment_status"]): PaymentStatus {
  switch (status) {
    case "pending_payment":
      return "not_started";
    case "payment_processing":
      return "processing";
    case "paid":
      return "captured";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    default:
      return "not_started";
  }
}

export function mapDbFulfillmentToDomain(
  status: OrderRow["fulfillment_status"],
): FulfillmentStatus {
  switch (status) {
    case "not_started":
      return "not_started";
    case "fulfillment_pending":
      return "queued";
    case "processing":
      return "processing";
    case "fulfilled":
      return "fulfilled";
    case "partially_fulfilled":
      return "partially_fulfilled";
    case "failed":
      return "failed";
    case "manual_review":
      return "manual_review";
    default:
      return "not_started";
  }
}

export function mapDbRefundToDomain(status: OrderRow["refund_status"]): RefundStatus {
  return status;
}

export function mapQuote(row: QuoteRow, items: QuoteItemRow[]): CheckoutQuote {
  const lines: QuoteLine[] = items.map((item) => ({
    productId: item.product_id,
    sku: item.sku,
    title: localized(item.title_en, item.title_ar),
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    clientUnitPrice: item.client_unit_price != null ? Number(item.client_unit_price) : undefined,
    totalPrice: Number(item.total_price),
    currency: asCurrency(item.currency),
    regionCode: item.region_code,
    regionLabel: localized(item.region_label_en, item.region_label_ar),
    redemptionCurrency: item.redemption_currency ? asCurrency(item.redemption_currency) : undefined,
    available: item.available,
  }));

  return {
    id: row.id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    items: lines,
    lines,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    tax: Number(row.tax),
    vat: Number(row.tax),
    fees: Number(row.fees),
    total: Number(row.total),
    currency: asCurrency(row.payment_currency),
    paymentCurrency: asCurrency(row.payment_currency),
    displayCurrency: asCurrency(row.display_currency),
    country: row.country,
    regionCode: row.region_code,
    promoCode: row.promo_code ?? undefined,
    availabilityStatus: row.availability_status,
    warnings: (row.warnings as unknown as QuoteWarning[]) ?? [],
  };
}

export function mapOrder(row: OrderRow, items: OrderItemRow[]): Order {
  const payment = mapDbPaymentToDomain(row.payment_status);
  const fulfillment = mapDbFulfillmentToDomain(row.fulfillment_status);
  const refund = mapDbRefundToDomain(row.refund_status);

  const mappedItems = items
    .sort((a, b) => a.item_index - b.item_index)
    .map((item) => {
      const base = {
        id: item.id,
        productId: item.product_id,
        title: localized(item.title_en, item.title_ar),
        regionCode: row.country,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        fulfillmentStatus: fulfillment,
      };
      if (item.kind === "gift_card") {
        return {
          ...base,
          productKind: "gift_card" as const,
          denominationLabel: item.sku,
        };
      }
      return {
        ...base,
        productKind: "direct_topup" as const,
        packageLabel: item.sku,
        fulfillmentFields: (item.fulfillment_fields ?? {}) as Record<string, string>,
      };
    });

  return withDerivedDisplayStatus({
    id: row.id,
    quoteId: row.quote_id ?? "",
    createdAt: row.created_at,
    paymentStatus: payment,
    fulfillmentStatus: fulfillment,
    refundStatus: refund,
    paymentMethod: row.payment_method ?? "unknown",
    paymentCurrency: asCurrency(row.payment_currency),
    total: Number(row.total),
    items: mappedItems,
    events: [],
  });
}

export function mapSupportTicket(
  row: Database["public"]["Tables"]["support_tickets"]["Row"],
): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    reason: row.reason as SupportTicket["reason"],
    orderId: row.order_id ?? undefined,
    orderItemId: row.order_item_id ?? undefined,
    description: row.description,
    attachment: (row.attachment as SupportTicket["attachment"]) ?? undefined,
    preferredContactMethod: row.preferred_contact_method as SupportTicket["preferredContactMethod"],
    internalMetadata: row.internal_metadata as SupportTicket["internalMetadata"],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type { Json };
