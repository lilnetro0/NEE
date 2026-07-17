import type { NewSupportTicket, SupportTicket } from "@/domain/support";
import type { RequestOptions } from "../options";
import { notFoundError, ok } from "../result";
import type { SupportRepository } from "../repositories/support-repository";
import { withMockLatency } from "./delay";

const tickets = new Map<string, SupportTicket>();

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
            orderItemId: ticket.orderItemId,
            description: ticket.description,
            attachment: ticket.attachment,
            preferredContactMethod: ticket.preferredContactMethod,
            internalMetadata: {
              ...ticket.internalMetadata,
              // The mock owns the authoritative submission timestamp.
              timestamps: {
                ...ticket.internalMetadata.timestamps,
                submittedAt: now,
              },
            },
            status: "open",
            createdAt: now,
            updatedAt: now,
          };
          tickets.set(created.id, created);
          return ok(created);
        },
        options,
      );
    },

    async list(options?: RequestOptions) {
      return withMockLatency(
        120,
        () => ok([...tickets.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
        options,
      );
    },

    async getById(id: string, options?: RequestOptions) {
      return withMockLatency(
        100,
        () => {
          const ticket = tickets.get(id);
          return ticket ? ok(ticket) : notFoundError("Support ticket", id);
        },
        options,
      );
    },
  };
}
