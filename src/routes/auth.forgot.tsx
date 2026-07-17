import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useRepositories } from "@/data-access";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot")({
  component: Forgot,
});

function Forgot() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { auth } = useRepositories();
  const authUi = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const result = await auth.requestPasswordReset(email.trim());
      if (!result.ok) {
        authUi.setLastError(result.error);
        authUi.setPhase(authUi.mapErrorToPhase(result.error));
        toast.error(
          result.error.message === "NETWORK_ERROR" ? t("auth_networkError") : t("auth_resetFailed"),
        );
        return;
      }
      authUi.setChallenge(result.data);
      authUi.setPhase("awaiting_otp");
      nav({ to: "/auth/reset" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("forgot")} subtitle={t("auth_forgotSubtitle")}>
      <Field label={t("email")}>
        <TextInput
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <PrimaryButton disabled={busy || !email.includes("@")} onClick={() => void submit()}>
        {busy ? t("loading") : t("continue")}
      </PrimaryButton>
    </AuthShell>
  );
}
