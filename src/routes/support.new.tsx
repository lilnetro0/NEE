import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileUp, LifeBuoy, X } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useOrders, useSupportMutations } from "@/data-access";
import {
  localizedSupportReason,
  type SupportAttachmentPlaceholder,
  type SupportContactMethod,
  type SupportReason,
} from "@/domain/support";
import { usePlatform } from "@/platform/PlatformProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/support/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === "string" ? search.orderId : undefined,
    itemId: typeof search.itemId === "string" ? search.itemId : undefined,
  }),
  component: NewSupportTicket,
});

const REASONS: SupportReason[] = [
  "code_not_working",
  "code_already_redeemed",
  "topup_not_received",
  "wrong_player_id",
  "charged_without_order",
  "duplicate_charge",
  "region_mismatch",
  "refund_request",
  "other",
];

function NewSupportTicket() {
  const { t, locale } = useI18n();
  const { orderId: initialOrderId, itemId: initialItemId } = Route.useSearch();
  const nav = useNavigate();
  const { submit: submitTicket } = useSupportMutations();
  const { data: orders = [], status: ordersStatus, reload } = useOrders();
  const { device, appVersion } = usePlatform();
  const [reason, setReason] = useState<SupportReason | null>(null);
  const [orderId, setOrderId] = useState(initialOrderId ?? "");
  const [orderItemId, setOrderItemId] = useState(initialItemId ?? "");
  const [desc, setDesc] = useState("");
  const [attachment, setAttachment] = useState<SupportAttachmentPlaceholder | null>(null);
  const [contactMethod, setContactMethod] = useState<SupportContactMethod>("email");
  const [busy, setBusy] = useState(false);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === orderId),
    [orders, orderId],
  );
  const selectedItem = selectedOrder?.items.find((item) => item.id === orderItemId);
  const permitsNoOrder = reason === "charged_without_order";

  useEffect(() => {
    if (!selectedOrder) {
      if (orderItemId) setOrderItemId("");
      return;
    }
    if (!selectedOrder.items.some((item) => item.id === orderItemId)) {
      setOrderItemId(selectedOrder.items.length === 1 ? selectedOrder.items[0].id : "");
    }
  }, [selectedOrder, orderItemId]);

  const chooseAttachment = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("support_fileTooLarge"));
      return;
    }
    setAttachment({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      status: "pending_upload",
    });
  };

  const submit = async () => {
    const hasOrderContext = permitsNoOrder || Boolean(selectedOrder && selectedItem);
    if (!reason || !hasOrderContext || desc.trim().length < 10) {
      toast.error(t("support_completeDetails"));
      return;
    }
    setBusy(true);
    try {
      const [deviceInfo, versionInfo] = await Promise.all([device.getInfo(), appVersion.getInfo()]);
      const capturedAt = new Date().toISOString();
      const r = await submitTicket({
        reason,
        orderId: selectedOrder?.id,
        orderItemId: selectedItem?.id,
        description: desc.trim(),
        attachment: attachment ?? undefined,
        preferredContactMethod: contactMethod,
        // Internal metadata is submitted to the repository but never rendered.
        internalMetadata: {
          orderId: selectedOrder?.id,
          orderItemId: selectedItem?.id,
          paymentReference: "PAYMENT_REFERENCE_PENDING",
          fulfillmentReference: "FULFILLMENT_REFERENCE_PENDING",
          timestamps: {
            orderCreatedAt: selectedOrder?.createdAt,
            clientCapturedAt: capturedAt,
            submittedAt: capturedAt,
          },
          appVersion: versionInfo.version,
          appBuild: versionInfo.build,
          devicePlatform: deviceInfo.platform,
        },
      });
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(`${t("support_ticketCreated")} ${r.data.id}`);
      nav({ to: "/support" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen>
      <TopBar title={t("support_getHelp")} showBack />
      <ScreenBody>
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          <LifeBuoy className="h-4 w-4 text-primary" />
          <p>{t("support_intro")}</p>
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("support_order")}
        </label>
        {ordersStatus === "error" ? (
          <button
            type="button"
            onClick={reload}
            className="mb-5 w-full rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {t("support_ordersError")}
          </button>
        ) : (
          <select
            value={orderId}
            disabled={ordersStatus === "loading"}
            onChange={(event) => {
              setOrderId(event.target.value);
              setOrderItemId("");
            }}
            className="mb-5 h-12 w-full rounded-2xl border border-input bg-surface px-3 text-sm outline-none focus:border-brand"
          >
            <option value="">
              {ordersStatus === "loading"
                ? t("support_ordersLoading")
                : permitsNoOrder
                  ? t("support_noOrder")
                  : t("support_selectOrder")}
            </option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.id} · {order.items[0]?.title[locale] ?? ""}
              </option>
            ))}
          </select>
        )}

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("support_orderItem")}
        </label>
        <select
          value={orderItemId}
          disabled={!selectedOrder}
          onChange={(event) => setOrderItemId(event.target.value)}
          className="mb-5 h-12 w-full rounded-2xl border border-input bg-surface px-3 text-sm outline-none focus:border-brand disabled:opacity-50"
        >
          <option value="">{t("support_selectItem")}</option>
          {selectedOrder?.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title[locale]} · {item.id}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("support_reason")}
        </label>
        <div className="mb-5 space-y-2">
          {REASONS.map((supportReason) => (
            <button
              key={supportReason}
              type="button"
              onClick={() => {
                setReason(supportReason);
                if (supportReason === "charged_without_order") {
                  setOrderId("");
                  setOrderItemId("");
                }
              }}
              className={
                "flex w-full items-center rounded-2xl border-2 px-4 py-3 text-start text-sm " +
                (reason === supportReason
                  ? "border-brand bg-brand/10 font-semibold"
                  : "border-input bg-surface")
              }
            >
              {localizedSupportReason(supportReason, locale)}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("support_description")}
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={5}
          maxLength={1000}
          className="w-full rounded-2xl border border-input bg-surface p-3 text-sm outline-none focus:border-brand"
          placeholder={t("support_descriptionPlaceholder")}
        />

        <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("support_attachment")}
        </label>
        {attachment ? (
          <div className="flex items-center gap-3 rounded-2xl border border-input bg-surface p-3">
            <FileUp className="h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold" dir="ltr">
                {attachment.fileName}
              </div>
              <div className="text-xs text-muted-foreground">
                {(attachment.sizeBytes / 1024).toFixed(0)} KB
              </div>
            </div>
            <button
              type="button"
              aria-label={t("support_removeFile")}
              onClick={() => setAttachment(null)}
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-input bg-surface p-4">
            <FileUp className="h-5 w-5 shrink-0 text-brand" />
            <div>
              <div className="text-sm font-semibold">{t("support_chooseFile")}</div>
              <div className="text-xs text-muted-foreground">{t("support_attachmentHint")}</div>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={(event) => chooseAttachment(event.target.files?.[0])}
            />
          </label>
        )}

        <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("support_contactMethod")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["email", "phone"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setContactMethod(method)}
              className={cn(
                "rounded-2xl border-2 px-4 py-3 text-sm font-semibold",
                contactMethod === method ? "border-brand bg-brand/10" : "border-input bg-surface",
              )}
            >
              {method === "email" ? t("support_contactEmail") : t("support_contactPhone")}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy || ordersStatus === "loading"}
          onClick={() => void submit()}
          className="mt-6 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
        >
          {busy ? t("support_submitting") : t("support_submit")}
        </button>
      </ScreenBody>
    </MobileScreen>
  );
}
