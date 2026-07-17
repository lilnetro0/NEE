import type { PromotionRepository } from "../repositories/promotion-repository";
import type { RequestOptions } from "../options";
import { cancelledError, ok } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapPromotion } from "./mappers";

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

export function createSupabasePromotionRepository(): PromotionRepository {
  return {
    async list(options) {
      if (aborted(options)) return cancelledError();
      const { data, error } = await getSupabaseClient()
        .from("promotions")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) return mapSupabaseError(error);
      return ok((data ?? []).map(mapPromotion));
    },
  };
}
