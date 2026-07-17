import {
  brands,
  categories,
  products,
} from "@/data/catalog";
import type { AccountVerification } from "@/domain/product";
import type { FieldValues } from "@/domain/forms";
import type { RequestOptions } from "../options";
import { notFoundError, ok, type Result } from "../result";
import type {
  ProductListParams,
  ProductRepository,
} from "../repositories/product-repository";
import { withMockLatency } from "./delay";

export function createMockProductRepository(): ProductRepository {
  return {
    async list(params?: ProductListParams, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          const filtered = products.filter((p) => {
            if (params?.categoryId && p.categoryId !== params.categoryId) return false;
            if (params?.brandId && p.brandId !== params.brandId) return false;
            if (params?.ids && !params.ids.includes(p.id)) return false;
            if (params?.q) {
              const q = params.q.toLowerCase();
              return (
                p.title.en.toLowerCase().includes(q) ||
                p.title.ar.includes(params.q) ||
                p.brandId.includes(q)
              );
            }
            return true;
          });
          return ok(filtered);
        },
        options,
      );
    },

    async getById(id: string, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          const product = products.find((p) => p.id === id);
          return product ? ok(product) : notFoundError("Product", id);
        },
        options,
      );
    },

    async listCategories(options?: RequestOptions) {
      return withMockLatency(0, () => ok(categories), options);
    },

    async getCategoryById(id: string, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          const category = categories.find((c) => c.id === id);
          return category ? ok(category) : notFoundError("Category", id);
        },
        options,
      );
    },

    async listBrands(options?: RequestOptions) {
      return withMockLatency(0, () => ok(brands), options);
    },

    async getBrandById(id: string, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          const brand = brands.find((b) => b.id === id);
          return brand ? ok(brand) : notFoundError("Brand", id);
        },
        options,
      );
    },

    async verifyAccount(
      _productId: string,
      values: FieldValues,
      options?: RequestOptions,
    ): Promise<Result<AccountVerification>> {
      return withMockLatency(
        400,
        (): Result<AccountVerification> => {
          if (!Object.values(values).some((v) => v && v.trim())) {
            return ok<AccountVerification>({
              ok: false,
              reason: "invalid_input",
              message: {
                en: "Please fill required fields",
                ar: "يرجى ملء الحقول المطلوبة",
              },
            });
          }
          return ok<AccountVerification>({
            ok: true,
            nickname: "NetroPlayer",
            server: values.server ?? "Asia",
            region: "Global",
          });
        },
        options,
      );
    },
  };
}
