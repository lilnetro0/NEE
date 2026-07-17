import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset")({
  component: Reset,
});

function Reset() {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <AuthShell title={t("resetPassword")}>
      <Field label={t("newPassword")}><TextInput type="password" placeholder="••••••••" /></Field>
      <Field label={t("confirmPassword")}><TextInput type="password" placeholder="••••••••" /></Field>
      <PrimaryButton
        onClick={() => {
          toast.success("Password updated");
          nav({ to: "/auth/login" });
        }}
      >
        {t("save")}
      </PrimaryButton>
    </AuthShell>
  );
}
