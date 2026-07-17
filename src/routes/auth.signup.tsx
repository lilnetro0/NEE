import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
});

function Signup() {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const auth = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const busy = auth.phase === "loading";

  const submit = async () => {
    if (!displayName.trim() || !/^\+?\d{8,15}$/.test(phone.replace(/\s/g, ""))) {
      toast.error(isAr ? "أدخل الاسم ورقم الجوال" : "Enter your name and phone number");
      return;
    }
    const ok = await auth.signup({
      displayName: displayName.trim(),
      phone: phone.replace(/\s/g, ""),
      email: email.trim() || undefined,
      password: password.length >= 6 ? password : undefined,
    });
    if (ok) {
      nav({ to: "/auth/otp" });
      return;
    }
    const msg =
      auth.phase === "rate_limited"
        ? t("auth_rateLimited")
        : auth.phase === "network_error"
          ? t("auth_networkError")
          : t("auth_signupFailed");
    toast.error(msg);
  };

  return (
    <AuthShell
      title={t("signup")}
      subtitle={t("auth_signupSubtitle")}
      footer={
        <div className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link to="/auth/login" className="font-semibold text-brand">
            {t("login")}
          </Link>
        </div>
      }
    >
      <Field label={t("fullName")}>
        <TextInput
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ahmad Al-Saud"
        />
      </Field>
      <Field label={t("phone")}>
        <TextInput
          type="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+966 5X XXX XXXX"
        />
      </Field>
      <Field label={`${t("email")} (${t("auth_optional")})`}>
        <TextInput
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Field label={`${t("password")} (${t("auth_optional")})`}>
        <TextInput
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <p className="text-xs text-muted-foreground">{t("auth_termsHint")}</p>
      <PrimaryButton disabled={busy} onClick={() => void submit()}>
        {busy ? t("loading") : t("auth_sendCode")}
      </PrimaryButton>
    </AuthShell>
  );
}
