import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/auth/forgot")({
  component: Forgot,
});

function Forgot() {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <AuthShell title={t("forgot")} subtitle="Enter your email and we'll send a reset link.">
      <Field label={t("email")}><TextInput type="email" placeholder="you@example.com" /></Field>
      <PrimaryButton onClick={() => nav({ to: "/auth/reset" })}>{t("continue")}</PrimaryButton>
    </AuthShell>
  );
}
