import type { Brand, BrandListParams, Category } from "@/domain/catalog";
import type { AccountVerification, Product } from "@/domain/product";
import type { Region } from "@/domain/regions";
import type { FieldValues } from "@/domain/forms";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type ProductListParams = {
  categoryId?: string;
  brandId?: string;
  regionId?: string;
  platform?: string;
  featured?: boolean;
  popular?: boolean;
  q?: string;
  ids?: string[];
  /** Max rows to return (server-enforced). Defaults to 48. */
  limit?: number;
  /** Offset for pagination. Defaults to 0. */
  offset?: number;
  /**
   * When true (default for list screens), skip loading denominations/packages/fields.
   * Detail views should call getById instead.
   */
  summary?: boolean;
};

export type ProductRepository = {
  list(params?: ProductListParams, options?: RequestOptions): Promise<Result<Product[]>>;
  getById(id: string, options?: RequestOptions): Promise<Result<Product>>;
  listCategories(options?: RequestOptions): Promise<Result<Category[]>>;
  getCategoryById(id: string, options?: RequestOptions): Promise<Result<Category>>;
  listBrands(params?: BrandListParams, options?: RequestOptions): Promise<Result<Brand[]>>;
  getBrandById(id: string, options?: RequestOptions): Promise<Result<Brand>>;
  listRegions(options?: RequestOptions): Promise<Result<Region[]>>;
  listRegionsForBrand(
    brandId: string,
    params?: { categoryId?: string },
    options?: RequestOptions,
  ): Promise<Result<Region[]>>;
  verifyAccount(
    productId: string,
    values: FieldValues,
    options?: RequestOptions,
  ): Promise<Result<AccountVerification>>;
};
