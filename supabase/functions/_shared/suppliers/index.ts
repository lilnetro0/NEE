/**
 * Edge-compatible supplier adapter contracts (Deno).
 * Mirrors src/domain/supplier.ts — keep in sync intentionally.
 */

export type SupplierAdapterCode = "stub" | "reloadly" | "likecard" | "gamesdrop";

export type SupplierResultStatus = "ok" | "pending" | "failed" | "not_implemented";

export type SupplierResult<T = Record<string, unknown>> = {
  status: SupplierResultStatus;
  code?: string;
  message?: string;
  data?: T;
};

export type SupplierAccountValidationInput = {
  productId: string;
  sku: string;
  fields: Record<string, string>;
};

export type SupplierProductRef = {
  supplierProductId: string;
  supplierSku?: string;
  country?: string;
  currency?: string;
};

export type SupplierFulfillOrderInput = {
  orderId: string;
  orderItemId: string;
  productId: string;
  sku: string;
  quantity: number;
  fields: Record<string, string>;
  requestId: string;
  productRef: SupplierProductRef;
};

export type SupplierOrderStatusInput = {
  providerRef: string;
  requestId?: string;
};

export interface SupplierAdapter {
  readonly code: SupplierAdapterCode;
  validateAccount(input: SupplierAccountValidationInput): Promise<SupplierResult>;
  getProduct(ref: SupplierProductRef): Promise<SupplierResult>;
  getPrice(ref: SupplierProductRef): Promise<SupplierResult<{ amount: number; currency: string }>>;
  checkAvailability(ref: SupplierProductRef): Promise<SupplierResult<{ available: boolean }>>;
  fulfillOrder(input: SupplierFulfillOrderInput): Promise<SupplierResult<{ providerRef?: string }>>;
  checkOrderStatus(input: SupplierOrderStatusInput): Promise<SupplierResult>;
}

function notImplemented(code: SupplierAdapterCode, method: string): SupplierResult {
  return {
    status: "not_implemented",
    code: "SUPPLIER_NOT_IMPLEMENTED",
    message: `${code}.${method} is not connected. Configure adapter and credentials before enabling.`,
  };
}

export function createPlaceholderAdapter(code: SupplierAdapterCode): SupplierAdapter {
  return {
    code,
    async validateAccount() {
      return notImplemented(code, "validateAccount");
    },
    async getProduct() {
      return notImplemented(code, "getProduct");
    },
    async getPrice() {
      return notImplemented(code, "getPrice");
    },
    async checkAvailability() {
      return notImplemented(code, "checkAvailability");
    },
    async fulfillOrder() {
      return notImplemented(code, "fulfillOrder");
    },
    async checkOrderStatus() {
      return notImplemented(code, "checkOrderStatus");
    },
  };
}

export const ReloadlyAdapter = createPlaceholderAdapter("reloadly");
export const LikeCardAdapter = createPlaceholderAdapter("likecard");
export const GamesDropAdapter = createPlaceholderAdapter("gamesdrop");
export const StubAdapter = createPlaceholderAdapter("stub");

const REGISTRY: Record<SupplierAdapterCode, SupplierAdapter> = {
  stub: StubAdapter,
  reloadly: ReloadlyAdapter,
  likecard: LikeCardAdapter,
  gamesdrop: GamesDropAdapter,
};

export function getSupplierAdapter(code: string): SupplierAdapter {
  const key = (code in REGISTRY ? code : "stub") as SupplierAdapterCode;
  return REGISTRY[key];
}

export type ResolvedSupplierMapping = {
  mappingId: string;
  supplierId: string;
  adapterCode: SupplierAdapterCode;
  supplierProductRef: string;
  supplierSku: string | null;
  supplierCost: number | null;
  currency: string;
  country: string | null;
  priority: number;
};

/**
 * Orders active mappings by priority ascending (1 = highest).
 * Caller supplies rows already filtered to product_id + sku.
 */
export function resolveSupplierMappings(
  rows: Array<{
    id: string;
    supplier_id: string;
    supplier_product_ref: string;
    supplier_sku: string | null;
    supplier_cost: number | null;
    currency: string;
    country: string | null;
    priority: number;
    is_active: boolean;
    adapter_code?: string;
  }>,
): ResolvedSupplierMapping[] {
  return rows
    .filter((r) => r.is_active)
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((r) => ({
      mappingId: r.id,
      supplierId: r.supplier_id,
      adapterCode: (r.adapter_code as SupplierAdapterCode) || "stub",
      supplierProductRef: r.supplier_product_ref,
      supplierSku: r.supplier_sku,
      supplierCost: r.supplier_cost,
      currency: r.currency,
      country: r.country,
      priority: r.priority,
    }));
}
