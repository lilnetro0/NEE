import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
});

function Signup() {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <AuthShell
      title={t("signup")}
      footer={
        <div className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link to="/auth/login" className="font-semibold text-brand">{t("login")}</Link>
        </div>
      }
    >
      <Field label={t("fullName")}><TextInput placeholder="Ahmad Al-Saud" /></Field>
      <Field label={t("email")}><TextInput type="email" placeholder="you@example.com" /></Field>
      <Field label={t("phone")}><TextInput type="tel" placeholder="+966 5X XXX XXXX" /></Field>
      <Field label={t("password")}><TextInput type="password" placeholder="••••••••" /></Field>
      <p className="text-xs text-muted-foreground">
        By continuing you agree to NETRO's Terms and Privacy Policy.
      </p>
      <PrimaryButton onClick={() => nav({ to: "/auth/otp" })}>{t("continue")}</PrimaryButton>
    </AuthShell>
  );
}
