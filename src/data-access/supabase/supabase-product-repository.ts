import type { ProductListParams, ProductRepository } from "../repositories/product-repository";
import type { RequestOptions } from "../options";
import { cancelledError, notFoundError, ok, type Result } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapBrand, mapCategory, mapProduct } from "./mappers";
import type { AccountVerification } from "@/domain/product";
import type { FieldValues } from "@/domain/forms";

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

export function createSupabaseProductRepository(): ProductRepository {
  return {
    async list(params?: ProductListParams, options?: RequestOptions) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      let query = supabase.from("products").select("*");
      if (params?.categoryId) query = query.eq("category_id", params.categoryId);
      if (params?.brandId) query = query.eq("brand_id", params.brandId);
      if (params?.ids?.length) query = query.in("id", params.ids);
      const { data: products, error } = await query.order("id");
      if (error) return mapSupabaseError(error);
      const ids = (products ?? []).map((p) => p.id);
      const [{ data: dens }, { data: pkgs }, { data: fields }] = await Promise.all([
        supabase.from("denominations").select("*").in("product_id", ids.length ? ids : ["__none__"]),
        supabase.from("topup_packages").select("*").in("product_id", ids.length ? ids : ["__none__"]),
        supabase
          .from("product_required_fields")
          .select("*")
          .in("product_id", ids.length ? ids : ["__none__"]),
      ]);
      let mapped = (products ?? []).map((p) =>
        mapProduct(p, dens ?? [], pkgs ?? [], fields ?? []),
      );
      if (params?.q) {
        const q = params.q.toLowerCase();
        mapped = mapped.filter(
          (p) =>
            p.title.en.toLowerCase().includes(q) ||
            p.title.ar.includes(params.q!) ||
            p.brandId.includes(q),
        );
      }
      return ok(mapped);
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
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) return mapSupabaseError(error);
      return ok((data ?? []).map(mapCategory));
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
      const { data, error } = await getSupabaseClient().from("brands").select("*").order("name_en");
      if (error) return mapSupabaseError(error);
      return ok((data ?? []).map(mapBrand));
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
