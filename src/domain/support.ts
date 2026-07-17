import type { IsoDateTime, Localized } from "./common";

export type SupportReason =
  | "code_not_working"
  | "code_already_redeemed"
  | "topup_not_received"
  | "wrong_player_id"
  | "charged_without_order"
  | "duplicate_charge"
  | "region_mismatch"
  | "refund_request"
  | "other";

export type SupportContactMethod = "email" | "phone";

export function localizedSupportReason(reason: SupportReason, locale: "en" | "ar"): string {
  const labels: Record<SupportReason, Localized> = {
    code_not_working: { en: "Code not working", ar: "الكود لا يعمل" },
    code_already_redeemed: {
      en: "Code already redeemed",
      ar: "الكود مستخدم مسبقاً",
    },
    topup_not_received: { en: "Top-up not received", ar: "لم يصل الشحن" },
    wrong_player_id: { en: "Wrong Player ID", ar: "معرّف لاعب خاطئ" },
    charged_without_order: {
      en: "Charged without an order",
      ar: "تم الخصم بدون طلب",
    },
    duplicate_charge: { en: "Duplicate charge", ar: "خصم مكرر" },
    region_mismatch: { en: "Region mismatch", ar: "منطقة غير متطابقة" },
    refund_request: { en: "Refund request", ar: "طلب استرداد" },
    other: { en: "Other", ar: "أخرى" },
  };
  return labels[reason][locale];
}

/**
 * File metadata only. The current frontend does not upload or retain file
 * contents; a backend upload flow can replace this placeholder later.
 */
export type SupportAttachmentPlaceholder = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: "pending_upload";
};

/**
 * Operational context prepared for support agents. This object is never
 * rendered in the customer form and deliberately contains no supplier data or
 * raw upstream responses.
 */
export type SupportTicketInternalMetadata = {
  orderId?: string;
  orderItemId?: string;
  paymentReference: "PAYMENT_REFERENCE_PENDING";
  fulfillmentReference: "FULFILLMENT_REFERENCE_PENDING";
  timestamps: {
    orderCreatedAt?: IsoDateTime;
    clientCapturedAt: IsoDateTime;
    submittedAt: IsoDateTime;
  };
  appVersion: string;
  appBuild?: string;
  devicePlatform: "web" | "ios" | "android";
};

export type SupportTicketStatus =
  "open" | "waiting_for_customer" | "in_progress" | "resolved" | "closed";

export type SupportTicket = {
  id: string;
  userId: string;
  reason: SupportReason;
  orderId?: string;
  orderItemId?: string;
  description: string;
  attachment?: SupportAttachmentPlaceholder;
  preferredContactMethod: SupportContactMethod;
  internalMetadata: SupportTicketInternalMetadata;
  status: SupportTicketStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type NewSupportTicket = Pick<
  SupportTicket,
  | "reason"
  | "orderId"
  | "orderItemId"
  | "description"
  | "attachment"
  | "preferredContactMethod"
  | "internalMetadata"
>;
