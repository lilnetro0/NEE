import { notifications as seedNotifications } from "@/data/orders";
import type { Notification } from "@/domain/notification";
import type { RequestOptions } from "../options";
import { notFoundError, ok } from "../result";
import type { NotificationRepository } from "../repositories/notification-repository";
import { withMockLatency } from "./delay";

export function createMockNotificationRepository(): NotificationRepository {
  let items: Notification[] = seedNotifications.map((n) => ({ ...n }));

  return {
    async list(options?: RequestOptions) {
      return withMockLatency(0, () => ok(items.map((n) => ({ ...n }))), options);
    },

    async markRead(id: string, options?: RequestOptions) {
      return withMockLatency(
        0,
        () => {
          const index = items.findIndex((n) => n.id === id);
          if (index < 0) return notFoundError("Notification", id);
          const updated = { ...items[index], read: true };
          items = items.map((n, i) => (i === index ? updated : n));
          return ok(updated);
        },
        options,
      );
    },
  };
}
