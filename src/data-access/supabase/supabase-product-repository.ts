import type { ProductListParams, ProductRepository } from "../repositories/product-repository";
import type { RequestOptions } from "../options";
import { cancelledError, notFoundError, ok, type Result } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapBrand, mapCategory, mapProduct, mapRegion } from "./mappers";
import type { Brand, Category } from "@/domain/catalog";
import type { AccountVerification } from "@/domain/product";
import type { Region } from "@/domain/regions";
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

async function loadRegionRows(codes: string[]) {
  if (!codes.length) return [];
  const { data } = await getSupabaseClient()
    .from("regions")
    .select("*")
    .in("code", [...new Set(codes)]);
  return data ?? [];
}

export function createSupabaseProductRepository(): ProductRepository {
  return {
    async list(params?: ProductListParams, options?: RequestOptions) {
      if (aborted(options)) return cancelledError();
      const limit = clampLimit(params?.limit);
      if (limit === 0) return ok([]);

      const supabase = getSupabaseClient();
      const offset = Math.max(0, Math.floor(params?.offset ?? 0));
      const summary = params?.summary !== false;

      let query = supabase
        .from("products")
        .select("*")
        .eq("is_visible", true)
        .eq("is_archived", false);
      if (params?.categoryId) query = query.eq("category_id", params.categoryId);
      if (params?.brandId) query = query.eq("brand_id", params.brandId);
      if (params?.regionId) query = query.eq("region_id", params.regionId);
      if (params?.platform) query = query.eq("payload->game->>platform", params.platform);
      if (params?.featured) query = query.eq("is_featured", true);
      if (params?.popular) query = query.contains("tags", ["bestseller"]);
      if (params?.ids?.length) query = query.in("id", params.ids);
      if (params?.q?.trim()) {
        const q = params.q.trim();
        query = query.or(`title_en.ilike.%${q}%,title_ar.ilike.%${q}%,brand_id.ilike.%${q}%`);
      }
      const { data: products, error } = await query.order("id").range(offset, offset + limit - 1);
      if (error) return mapSupabaseError(error);

      const regionRows = await loadRegionRows(
        (products ?? []).map((product) => product.region_id || product.region_code),
      );
      const regionsByCode = new Map(regionRows.map((region) => [region.code, region]));

      if (summary || !(products ?? []).length) {
        return ok(
          (products ?? []).map((p) =>
            mapProduct(p, [], [], [], regionsByCode.get(p.region_id || p.region_code)),
          ),
        );
      }

      const ids = (products ?? []).map((p) => p.id);
      const [{ data: dens }, { data: pkgs }, { data: fields }] = await Promise.all([
        supabase.from("denominations").select("*").in("product_id", ids).eq("is_active", true),
        supabase.from("topup_packages").select("*").in("product_id", ids).eq("is_active", true),
        supabase.from("product_required_fields").select("*").in("product_id", ids),
      ]);
      return ok(
        (products ?? []).map((p) =>
          mapProduct(
            p,
            dens ?? [],
            pkgs ?? [],
            fields ?? [],
            regionsByCode.get(p.region_id || p.region_code),
          ),
        ),
      );
    },

    async getById(id, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_visible", true)
        .eq("is_archived", false)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!product) return notFoundError("Product", id);
      const [{ data: dens }, { data: pkgs }, { data: fields }] = await Promise.all([
        supabase.from("denominations").select("*").eq("product_id", id).eq("is_active", true),
        supabase.from("topup_packages").select("*").eq("product_id", id).eq("is_active", true),
        supabase.from("product_required_fields").select("*").eq("product_id", id),
      ]);
      const regionRows = await loadRegionRows([product.region_id || product.region_code]);
      return ok(mapProduct(product, dens ?? [], pkgs ?? [], fields ?? [], regionRows[0]));
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
        .eq("is_hidden", false)
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
        .or(`id.eq.${id},slug.eq.${id}`)
        .eq("is_hidden", false)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) return notFoundError("Category", id);
      return ok(mapCategory(data));
    },

    async listBrands(params, options) {
      if (aborted(options)) return cancelledError();
      const now = Date.now();
      const cacheable = !params || Object.values(params).every((value) => value == null);
      if (cacheable && brandCache && now - brandCache.at < BRAND_CACHE_TTL_MS) {
        return ok(brandCache.value);
      }

      const supabase = getSupabaseClient();
      let brandIds: string[] | undefined;
      if (
        params?.categoryId ||
        params?.regionId ||
        params?.platform ||
        params?.featured ||
        params?.popular
      ) {
        let productsQuery = supabase
          .from("products")
          .select("brand_id")
          .eq("is_visible", true)
          .eq("is_archived", false);
        if (params.categoryId) productsQuery = productsQuery.eq("category_id", params.categoryId);
        if (params.regionId) productsQuery = productsQuery.eq("region_id", params.regionId);
        if (params.platform) {
          productsQuery = productsQuery.eq("payload->game->>platform", params.platform);
        }
        if (params.featured) productsQuery = productsQuery.eq("is_featured", true);
        if (params.popular) productsQuery = productsQuery.contains("tags", ["bestseller"]);
        const { data: productBrands, error: productBrandsError } = await productsQuery;
        if (productBrandsError) return mapSupabaseError(productBrandsError);
        brandIds = [...new Set((productBrands ?? []).map((row) => row.brand_id))];
        if (!brandIds.length) return ok([]);
      }

      let query = supabase.from("brands").select("*").eq("is_hidden", false);
      if (brandIds) query = query.in("id", brandIds);
      if (params?.q?.trim()) {
        const q = params.q.trim();
        query = query.or(`name_en.ilike.%${q}%,name_ar.ilike.%${q}%,slug.ilike.%${q}%`);
      }
      const { data, error } = await query
        .order("name_en")
        .limit(Math.min(params?.limit ?? 100, 100));
      if (error) return mapSupabaseError(error);
      const mapped = (data ?? []).map(mapBrand);
      if (cacheable) brandCache = { at: now, value: mapped };
      return ok(mapped);
    },

    async getBrandById(id, options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await getSupabaseClient()
        .from("brands")
        .select("*")
        .or(`id.eq.${id},slug.eq.${id}`)
        .eq("is_hidden", false)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) return notFoundError("Brand", id);
      return ok(mapBrand(data));
    },

    async listRegions(options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await getSupabaseClient()
        .from("regions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) return mapSupabaseError(error);
      return ok((data ?? []).map(mapRegion));
    },

    async listRegionsForBrand(brandId, params, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      let query = supabase
        .from("products")
        .select("region_id")
        .eq("brand_id", brandId)
        .eq("is_visible", true)
        .eq("is_archived", false);
      if (params?.categoryId) query = query.eq("category_id", params.categoryId);
      const { data: offerings, error: offeringError } = await query;
      if (offeringError) return mapSupabaseError(offeringError);
      const codes = [...new Set((offerings ?? []).map((row) => row.region_id))];
      if (!codes.length) return ok([]);
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .in("code", codes)
        .eq("is_active", true)
        .order("sort_order");
      if (error) return mapSupabaseError(error);
      return ok((data ?? []).map(mapRegion) as Region[]);
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
