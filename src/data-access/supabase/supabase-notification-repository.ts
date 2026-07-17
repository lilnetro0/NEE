import type { NotificationRepository } from "../repositories/notification-repository";
import type { RequestOptions } from "../options";
import { cancelledError, notFoundError, ok } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapNotification } from "./mappers";

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

export function createSupabaseNotificationRepository(): NotificationRepository {
  return {
    async list(options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return mapSupabaseError({ message: "UNAUTHORIZED" });
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return mapSupabaseError(error);
      return ok((data ?? []).map(mapNotification));
    },

    async markRead(id, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) return notFoundError("Notification", id);
      return ok(mapNotification(data));
    },
  };
}
