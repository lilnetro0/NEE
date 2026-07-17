import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useRepositories } from "@/data-access";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset")({
  component: Reset,
});

function Reset() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { auth } = useRepositories();
  const authUi = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!authUi.challenge) {
      toast.error(t("auth_expiredOtp"));
      nav({ to: "/auth/forgot" });
      return;
    }
    if (password.length < 6 || password !== confirm) {
      toast.error(t("auth_passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const result = await auth.resetPassword({
        challengeId: authUi.challenge.id,
        code,
        newPassword: password,
      });
      if (!result.ok) {
        authUi.setPhase(authUi.mapErrorToPhase(result.error));
        toast.error(
          result.error.message === "INVALID_OTP"
            ? t("auth_invalidOtp")
            : result.error.message === "OTP_EXPIRED"
              ? t("auth_expiredOtp")
              : t("auth_resetFailed"),
        );
        return;
      }
      authUi.setChallenge(null);
      authUi.setPhase("anonymous");
      toast.success(t("auth_passwordUpdated"));
      nav({ to: "/auth/login" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("resetPassword")} subtitle={t("auth_resetSubtitle")}>
      <Field label={t("otpTitle")}>
        <TextInput
          inputMode="numeric"
          dir="ltr"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
        />
      </Field>
      <Field label={t("newPassword")}>
        <TextInput
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <Field label={t("confirmPassword")}>
        <TextInput
          type="password"
          dir="ltr"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <p className="text-[11px] text-muted-foreground">{t("auth_otpHint")}</p>
      <PrimaryButton disabled={busy || code.length !== 6} onClick={() => void submit()}>
        {busy ? t("loading") : t("save")}
      </PrimaryButton>
    </AuthShell>
  );
}
