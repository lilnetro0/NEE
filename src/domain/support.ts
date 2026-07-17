import type { IsoDateTime } from "./common";

export type SupportReason =
  | "invalid_code"
  | "already_redeemed"
  | "topup_not_received"
  | "wrong_player_id"
  | "charged_without_order"
  | "duplicate_charge"
  | "region_mismatch"
  | "refund_request";

export type SupportTicketStatus =
  "open" | "waiting_for_customer" | "in_progress" | "resolved" | "closed";

export type SupportTicket = {
  id: string;
  userId: string;
  reason: SupportReason;
  orderId?: string;
  description: string;
  status: SupportTicketStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type NewSupportTicket = Pick<SupportTicket, "reason" | "orderId" | "description">;
