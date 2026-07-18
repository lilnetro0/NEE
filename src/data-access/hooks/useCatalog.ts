import { useCallback } from "react";
import type { ProductListParams } from "../repositories/product-repository";
import type { BrandListParams } from "@/domain/catalog";
import { useRepositories } from "../RepositoriesProvider";
import { useResultQuery } from "./useResultQuery";

export function useProducts(params?: ProductListParams) {
  const { products } = useRepositories();
  return useResultQuery(
    [
      "products",
      {
        brandId: params?.brandId,
        categoryId: params?.categoryId,
        regionId: params?.regionId,
        platform: params?.platform,
        featured: params?.featured,
        popular: params?.popular,
        q: params?.q,
        ids: params?.ids?.join(","),
        limit: params?.limit,
        offset: params?.offset,
        summary: params?.summary,
      },
    ],
    (signal) => products.list(params, { signal }),
  );
}

export function useProduct(id: string) {
  const { products } = useRepositories();
  return useResultQuery(["product", id], (signal) => products.getById(id, { signal }));
}

export function useCategories() {
  const { products } = useRepositories();
  return useResultQuery(["categories"], (signal) => products.listCategories({ signal }));
}

export function useCategory(id: string) {
  const { products } = useRepositories();
  return useResultQuery(["category", id], (signal) => products.getCategoryById(id, { signal }));
}

export function useBrands(params?: BrandListParams) {
  const { products } = useRepositories();
  return useResultQuery(["brands", params ?? {}], (signal) =>
    products.listBrands(params, { signal }),
  );
}

export function useBrand(id: string) {
  const { products } = useRepositories();
  return useResultQuery(["brand", id], (signal) => products.getBrandById(id, { signal }));
}

export function useRegions() {
  const { products } = useRepositories();
  return useResultQuery(["regions"], (signal) => products.listRegions({ signal }));
}

export function useBrandRegions(brandId: string, categoryId?: string) {
  const { products } = useRepositories();
  return useResultQuery(["brand-regions", brandId, categoryId], (signal) =>
    products.listRegionsForBrand(brandId, { categoryId }, { signal }),
  );
}

export function useVerifyAccount() {
  const { products } = useRepositories();
  return useCallback(
    (productId: string, values: Parameters<typeof products.verifyAccount>[1]) =>
      products.verifyAccount(productId, values),
    [products],
  );
}
