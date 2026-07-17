import type { Notification } from "@/domain/notification";
import type { NotificationRepository } from "../repositories/notification-repository";
import type { NetroApiClient } from "./api-client";

export function createHttpNotificationRepository(client: NetroApiClient): NotificationRepository {
  return {
    list(options) {
      return client.get<Notification[]>("/v1/notifications", {
        signal: options?.signal,
      });
    },
    markRead(id, options) {
      return client.post<Notification>(
        `/v1/notifications/${encodeURIComponent(id)}/read`,
        {},
        { signal: options?.signal },
      );
    },
  };
}
