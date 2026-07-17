import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { supportApi, type SupportReason } from "@/api/services";
import { toast } from "sonner";

export const Route = createFileRoute("/support/new")({
  component: NewSupportTicket,
});

const REASONS: { id: SupportReason; en: string; ar: string }[] = [
  { id: "invalid_code", en: "Invalid code", ar: "كود غير صالح" },
  { id: "already_redeemed", en: "Code already redeemed", ar: "الكود مستخدم مسبقاً" },
  { id: "topup_not_received", en: "Top-up not received", ar: "لم يصل الشحن" },
  { id: "wrong_player_id", en: "Wrong Player ID entered", ar: "معرّف لاعب خاطئ" },
  { id: "charged_without_order", en: "Charged without an order", ar: "تم الخصم بدون طلب" },
  { id: "duplicate_charge", en: "Duplicate charge", ar: "خصم مكرر" },
  { id: "region_mismatch", en: "Region mismatch", ar: "منطقة غير متطابقة" },
  { id: "refund_request", en: "Refund request", ar: "طلب استرداد" },
];

function NewSupportTicket() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const [reason, setReason] = useState<SupportReason | null>(null);
  const [orderId, setOrderId] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason || desc.trim().length < 10) {
      toast.error(isAr ? "يرجى استكمال التفاصيل" : "Please complete the details");
      return;
    }
    setBusy(true);
    try {
      const r = await supportApi.submit({ reason, orderId: orderId || undefined, description: desc });
      toast.success((isAr ? "تم إنشاء التذكرة " : "Ticket created ") + r.id);
      nav({ to: "/support" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen>
      <TopBar title={isAr ? "طلب مساعدة" : "Get help"} showBack />
      <ScreenBody>
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          <LifeBuoy className="h-4 w-4 text-primary" />
          <p>{isAr ? "اختر السبب الأنسب لتوجيه طلبك بشكل أسرع." : "Pick the reason that best matches — it speeds up your ticket."}</p>
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isAr ? "السبب" : "Reason"}
        </label>
        <div className="mb-5 space-y-2">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setReason(r.id)}
              className={
                "flex w-full items-center rounded-2xl border-2 px-4 py-3 text-start text-sm " +
                (reason === r.id ? "border-brand bg-brand/10 font-semibold" : "border-input bg-surface")
              }
            >
              {isAr ? r.ar : r.en}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isAr ? "رقم الطلب (اختياري)" : "Order ID (optional)"}
        </label>
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          dir="ltr"
          placeholder="NTR-XXXXXXX"
          className="mb-5 h-12 w-full rounded-2xl border border-input bg-surface px-3 font-mono text-sm outline-none focus:border-brand"
        />

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isAr ? "الوصف" : "Description"}
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={5}
          maxLength={1000}
          className="w-full rounded-2xl border border-input bg-surface p-3 text-sm outline-none focus:border-brand"
          placeholder={isAr ? "اشرح المشكلة بالتفصيل" : "Describe the issue in detail"}
        />

        <button
          disabled={busy}
          onClick={submit}
          className="mt-6 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
        >
          {busy ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب" : "Submit ticket")}
        </button>
      </ScreenBody>
    </MobileScreen>
  );
}
