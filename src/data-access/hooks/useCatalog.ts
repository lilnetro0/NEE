import { useCallback } from "react";
import type { ProductListParams } from "../repositories/product-repository";
import { useRepositories } from "../RepositoriesProvider";
import { useResultQuery } from "./useResultQuery";

export function useProducts(params?: ProductListParams) {
  const { products } = useRepositories();
  return useResultQuery(
    (signal) => products.list(params, { signal }),
    [
      products,
      params?.brandId,
      params?.categoryId,
      params?.q,
      params?.ids?.join(","),
      params?.limit,
      params?.offset,
      params?.summary,
    ],
  );
}

export function useProduct(id: string) {
  const { products } = useRepositories();
  return useResultQuery((signal) => products.getById(id, { signal }), [products, id]);
}

export function useCategories() {
  const { products } = useRepositories();
  return useResultQuery((signal) => products.listCategories({ signal }), [products]);
}

export function useCategory(id: string) {
  const { products } = useRepositories();
  return useResultQuery((signal) => products.getCategoryById(id, { signal }), [products, id]);
}

export function useBrands() {
  const { products } = useRepositories();
  return useResultQuery((signal) => products.listBrands({ signal }), [products]);
}

export function useBrand(id: string) {
  const { products } = useRepositories();
  return useResultQuery((signal) => products.getBrandById(id, { signal }), [products, id]);
}

export function useVerifyAccount() {
  const { products } = useRepositories();
  return useCallback(
    (productId: string, values: Parameters<typeof products.verifyAccount>[1]) =>
      products.verifyAccount(productId, values),
    [products],
  );
}
