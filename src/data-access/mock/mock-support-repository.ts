import type { NewSupportTicket, SupportTicket } from "@/domain/support";
import type { RequestOptions } from "../options";
import { ok } from "../result";
import type { SupportRepository } from "../repositories/support-repository";
import { withMockLatency } from "./delay";

export function createMockSupportRepository(): SupportRepository {
  return {
    async submit(ticket: NewSupportTicket, options?: RequestOptions) {
      return withMockLatency(
        300,
        () => {
          const now = new Date().toISOString();
          const created: SupportTicket = {
            id: `T-${Date.now().toString(36).toUpperCase()}`,
            userId: "user-ahmad",
            reason: ticket.reason,
            orderId: ticket.orderId,
            description: ticket.description,
            status: "open",
            createdAt: now,
            updatedAt: now,
          };
          return ok(created);
        },
        options,
      );
    },
  };
}
