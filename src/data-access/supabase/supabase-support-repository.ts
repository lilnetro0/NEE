import type { SupportRepository } from "../repositories/support-repository";
import type { RequestOptions } from "../options";
import { cancelledError, notFoundError, ok } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import { mapSupabaseError } from "./errors";
import { mapSupportTicket } from "./mappers";

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

export function createSupabaseSupportRepository(): SupportRepository {
  return {
    async submit(ticket, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return mapSupabaseError({ message: "UNAUTHORIZED" });
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: auth.user.id,
          reason: ticket.reason,
          order_id: ticket.orderId ?? null,
          order_item_id: ticket.orderItemId ?? null,
          description: ticket.description,
          attachment: ticket.attachment ?? null,
          preferred_contact_method: ticket.preferredContactMethod,
          internal_metadata: ticket.internalMetadata,
        })
        .select("*")
        .single();
      if (error) return mapSupabaseError(error);
      return ok(mapSupportTicket(data));
    },

    async list(options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return mapSupabaseError({ message: "UNAUTHORIZED" });
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) return mapSupabaseError(error);
      return ok((data ?? []).map(mapSupportTicket));
    },

    async getById(id, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return mapSupabaseError(error);
      if (!data) return notFoundError("SupportTicket", id);
      return ok(mapSupportTicket(data));
    },
  };
}
