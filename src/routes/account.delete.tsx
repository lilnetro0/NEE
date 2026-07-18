import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { useUserActions } from "@/data-access";
import { toast } from "sonner";

export const Route = createFileRoute("/account/delete")({
  component: DeleteAccount,
});

function DeleteAccount() {
  const { locale, t } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const authUi = useAuth();
  const { deleteAccount } = useUserActions();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = await authUi.getReauthToken();
      if (!token) {
        nav({ to: "/reauth", search: { redirect: "/account/delete" } });
      }
    })();
  }, [authUi, nav]);

  const canSubmit = password.length >= 6 && confirm === "DELETE";

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const result = await deleteAccount(password);
      if (!result.ok) {
        toast.error(t("account_deleteFailed"));
        return;
      }
      await authUi.logout();
      toast.success(t("account_deleted"));
      nav({ to: "/auth/login" });
    } catch {
      toast.error(t("account_deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen>
      <TopBar title={t("auth_deleteAccount")} showBack />
      <ScreenBody>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-bold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {t("account_deletePermanent")}
          </div>
          <p className="text-xs text-muted-foreground">{t("account_deleteBody")}</p>
        </div>

        <label className="mt-6 mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("password")}
        </label>
        <input
          type="password"
          value={password}
          dir="ltr"
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 w-full rounded-2xl border border-input bg-surface px-3 outline-none focus:border-brand"
        />

        <label className="mt-4 mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("account_typeDeleteConfirm")}
        </label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          dir="ltr"
          className="h-12 w-full rounded-2xl border border-input bg-surface px-3 font-mono uppercase outline-none focus:border-destructive"
        />

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit || busy}
          className="mt-8 h-14 w-full rounded-full bg-destructive text-sm font-bold text-destructive-foreground disabled:opacity-40"
        >
          {busy ? t("account_deleting") : t("account_deleteSubmit")}
        </button>
      </ScreenBody>
    </MobileScreen>
  );
}
