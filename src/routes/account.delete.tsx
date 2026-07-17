import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { authApi } from "@/api/services";
import { toast } from "sonner";

export const Route = createFileRoute("/account/delete")({
  component: DeleteAccount,
});

function DeleteAccount() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = password.length >= 6 && confirm === "DELETE";

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await authApi.deleteAccount(password);
      toast.success(isAr ? "تم حذف الحساب" : "Account deleted");
      nav({ to: "/auth/login" });
    } catch {
      toast.error(isAr ? "فشل الحذف" : "Deletion failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen>
      <TopBar title={isAr ? "حذف الحساب" : "Delete account"} showBack />
      <ScreenBody>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-bold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {isAr ? "هذا الإجراء لا يمكن التراجع عنه" : "This action is permanent"}
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "سيتم حذف حسابك وجميع بياناتك نهائياً. الطلبات النشطة والاستردادات المعلقة ستكتمل قبل الحذف."
              : "Your account and all data will be permanently deleted. Active orders and pending refunds must complete first."}
          </p>
        </div>

        <label className="mt-6 mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isAr ? "كلمة المرور" : "Password"}
        </label>
        <input
          type="password"
          value={password}
          dir="ltr"
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 w-full rounded-2xl border border-input bg-surface px-3 outline-none focus:border-brand"
        />

        <label className="mt-4 mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isAr ? "اكتب DELETE للتأكيد" : "Type DELETE to confirm"}
        </label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          dir="ltr"
          className="h-12 w-full rounded-2xl border border-input bg-surface px-3 font-mono uppercase outline-none focus:border-destructive"
        />

        <button
          onClick={submit}
          disabled={!canSubmit || busy}
          className="mt-8 h-14 w-full rounded-full bg-destructive text-sm font-bold text-destructive-foreground disabled:opacity-40"
        >
          {busy ? (isAr ? "جاري الحذف..." : "Deleting...") : isAr ? "حذف حسابي نهائياً" : "Delete my account"}
        </button>
      </ScreenBody>
    </MobileScreen>
  );
}
