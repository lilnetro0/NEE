import type { IsoDateTime, Localized } from "./common";

export type NotificationType = "order" | "promo" | "security" | "support";

export type Notification = {
  id: string;
  title: Localized;
  body: Localized;
  time: IsoDateTime;
  read: boolean;
  type: NotificationType;
};
