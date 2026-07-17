import type { Brand, Category } from "@/domain/catalog";
import type { AccountVerification, Product } from "@/domain/product";
import type { FieldValues } from "@/domain/forms";
import type { RequestOptions } from "../options";
import type { Result } from "../result";
import type { ProductListParams, ProductRepository } from "../repositories/product-repository";
import type { NetroApiClient } from "./api-client";

function qs(params?: ProductListParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.brandId) search.set("brandId", params.brandId);
  if (params.q) search.set("q", params.q);
  if (params.ids?.length) search.set("ids", params.ids.join(","));
  const value = search.toString();
  return value ? `?${value}` : "";
}

/** HTTP product catalog — NETRO backend only. */
export function createHttpProductRepository(client: NetroApiClient): ProductRepository {
  return {
    list(params, options) {
      return client.get<Product[]>(`/v1/catalog/products${qs(params)}`, {
        signal: options?.signal,
      });
    },
    getById(id, options) {
      return client.get<Product>(`/v1/catalog/products/${encodeURIComponent(id)}`, {
        signal: options?.signal,
      });
    },
    listCategories(options) {
      return client.get<Category[]>("/v1/catalog/categories", { signal: options?.signal });
    },
    getCategoryById(id, options) {
      return client.get<Category>(`/v1/catalog/categories/${encodeURIComponent(id)}`, {
        signal: options?.signal,
      });
    },
    listBrands(options) {
      return client.get<Brand[]>("/v1/catalog/brands", { signal: options?.signal });
    },
    getBrandById(id, options) {
      return client.get<Brand>(`/v1/catalog/brands/${encodeURIComponent(id)}`, {
        signal: options?.signal,
      });
    },
    verifyAccount(productId, values: FieldValues, options?: RequestOptions) {
      return client.post<AccountVerification>(
        `/v1/catalog/products/${encodeURIComponent(productId)}/validate-account`,
        { fields: values },
        { signal: options?.signal },
      );
    },
  };
}
