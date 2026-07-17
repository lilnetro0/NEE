import type { ProductListParams, ProductRepository } from "../repositories/product-repository";
import type { RequestOptions } from "../options";
import { cancelledError, notFoundError, ok, type Result } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapBrand, mapCategory, mapProduct } from "./mappers";
import type { Brand, Category } from "@/domain/catalog";
import type { AccountVerification } from "@/domain/product";
import type { FieldValues } from "@/domain/forms";

const DEFAULT_LIST_LIMIT = 48;
const MAX_LIST_LIMIT = 100;

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

function clampLimit(limit?: number): number {
  if (limit == null || !Number.isFinite(limit)) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.max(0, Math.floor(limit)));
}

type CacheEntry<T> = { at: number; value: T };
const CATEGORY_CACHE_TTL_MS = 60_000;
const BRAND_CACHE_TTL_MS = 60_000;
let categoryCache: CacheEntry<Category[]> | null = null;
let brandCache: CacheEntry<Brand[]> | null = null;

export function createSupabaseProductRepository(): ProductRepository {
  return {
    async list(params?: ProductListParams, options?: RequestOptions) {
      if (aborted(options)) return cancelledError();
      const limit = clampLimit(params?.limit);
      if (limit === 0) return ok([]);

      const supabase = getSupabaseClient();
      const offset = Math.max(0, Math.floor(params?.offset ?? 0));
      const summary = params?.summary !== false;

      let query = supabase.from("products").select("*");
      if (params?.categoryId) query = query.eq("category_id", params.categoryId);
      if (params?.brandId) query = query.eq("brand_id", params.brandId);
      if (params?.ids?.length) query = query.in("id", params.ids);
      if (params?.q?.trim()) {
        const q = params.q.trim();
        query = query.or(
          `title_en.ilike.%${q}%,title_ar.ilike.%${q}%,brand_id.ilike.%${q}%`,
        );
      }
      const { data: products, error } = await query
        .order("id")
        .range(offset, offset + limit - 1);
      if (error) return mapSupabaseError(error);

      if (summary || !(products ?? []).length) {
        return ok((products ?? []).map((p) => mapProduct(p, [], [], [])));
      }

      const ids = (products ?? []).map((p) => p.id);
      const [{ data: dens }, { data: pkgs }, { data: fields }] = await Promise.all([
        supabase.from("denominations").select("*").in("product_id", ids),
        supabase.from("topup_packages").select("*").in("product_id", ids),
        supabase.from("product_required_fields").select("*").in("product_id", ids),
      ]);
      return ok(
        (products ?? []).map((p) => mapProduct(p, dens ?? [], pkgs ?? [], fields ?? [])),
      );
    },

    async getById(id, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!product) return notFoundError("Product", id);
      const [{ data: dens }, { data: pkgs }, { data: fields }] = await Promise.all([
        supabase.from("denominations").select("*").eq("product_id", id),
        supabase.from("topup_packages").select("*").eq("product_id", id),
        supabase.from("product_required_fields").select("*").eq("product_id", id),
      ]);
      return ok(mapProduct(product, dens ?? [], pkgs ?? [], fields ?? []));
    },

    async listCategories(options) {
      if (aborted(options)) return cancelledError();
      const now = Date.now();
      if (categoryCache && now - categoryCache.at < CATEGORY_CACHE_TTL_MS) {
        return ok(categoryCache.value);
      }
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .select("*")
        .order("sort_order")
        .limit(100);
      if (error) return mapSupabaseError(error);
      const mapped = (data ?? []).map(mapCategory);
      categoryCache = { at: now, value: mapped };
      return ok(mapped);
    },

    async getCategoryById(id, options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) return notFoundError("Category", id);
      return ok(mapCategory(data));
    },

    async listBrands(options) {
      if (aborted(options)) return cancelledError();
      const now = Date.now();
      if (brandCache && now - brandCache.at < BRAND_CACHE_TTL_MS) {
        return ok(brandCache.value);
      }
      const { data, error } = await getSupabaseClient()
        .from("brands")
        .select("*")
        .order("name_en")
        .limit(100);
      if (error) return mapSupabaseError(error);
      const mapped = (data ?? []).map(mapBrand);
      brandCache = { at: now, value: mapped };
      return ok(mapped);
    },

    async getBrandById(id, options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await getSupabaseClient()
        .from("brands")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) return notFoundError("Brand", id);
      return ok(mapBrand(data));
    },

    async verifyAccount(productId, values: FieldValues, options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await getSupabaseClient().functions.invoke("verify-account", {
        body: { productId, values },
      });
      if (error) {
        const result: AccountVerification = {
          ok: false,
          reason: "temporarily_unavailable",
          message: {
            en: "Account lookup is temporarily unavailable.",
            ar: "التحقق من الحساب غير متاح مؤقتاً.",
          },
        };
        return ok(result);
      }
      return ok(data as AccountVerification);
    },
  };
}
