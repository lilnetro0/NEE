import type { UserRepository } from "../repositories/user-repository";
import type { RequestOptions } from "../options";
import { cancelledError, ok } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapProfileToUser, mapStoreCredit } from "./mappers";

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

export function createSupabaseUserRepository(): UserRepository {
  return {
    async getCurrent(options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) return mapSupabaseError(authError ?? { message: "UNAUTHORIZED" });
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) return mapSupabaseError({ message: "UNAUTHORIZED" });
      return ok(mapProfileToUser(data));
    },

    async getStoreCredit(options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) return mapSupabaseError(authError ?? { message: "UNAUTHORIZED" });
      const { data, error } = await supabase
        .from("store_credits")
        .select("*")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) {
        return ok({ balance: 0, currency: "SAR", transactions: [] });
      }
      return ok(mapStoreCredit(data));
    },
  };
}
