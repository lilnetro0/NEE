import type { Notification } from "@/domain/notification";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type NotificationRepository = {
  list(options?: RequestOptions): Promise<Result<Notification[]>>;
  markRead(id: string, options?: RequestOptions): Promise<Result<Notification>>;
};
