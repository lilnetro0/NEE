import type { NewSupportTicket, SupportTicket } from "@/domain/support";
import type { SupportRepository } from "../repositories/support-repository";
import type { NetroApiClient } from "./api-client";

export function createHttpSupportRepository(client: NetroApiClient): SupportRepository {
  return {
    submit(ticket: NewSupportTicket, options) {
      return client.post<SupportTicket>("/v1/support/tickets", ticket, {
        signal: options?.signal,
      });
    },
    list(options) {
      return client.get<SupportTicket[]>("/v1/support/tickets", {
        signal: options?.signal,
      });
    },
    getById(id, options) {
      return client.get<SupportTicket>(`/v1/support/tickets/${encodeURIComponent(id)}`, {
        signal: options?.signal,
      });
    },
  };
}
