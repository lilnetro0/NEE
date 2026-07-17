/**
 * Supplier adapter contracts — NETRO-owned fulfillment boundary.
 * No real distributor HTTP calls live here.
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

export type SupplierMappingRecord = {
  id: string;
  productId: string;
  sku: string;
  supplierId: string;
  supplierProductRef: string;
  supplierSku: string | null;
  supplierCost: number | null;
  currency: string;
  country: string | null;
  priority: number;
  isActive: boolean;
  adapterCode: SupplierAdapterCode;
};
