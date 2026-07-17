import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
});

/** Email + password signup. Phone OTP is deferred until SMS is configured. */
function Signup() {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const auth = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const busy = auth.phase === "loading";

  const submit = async () => {
    if (!displayName.trim() || !email.includes("@") || password.length < 6) {
      toast.error(
        isAr
          ? "أدخل الاسم والبريد وكلمة مرور من 6 أحرف على الأقل"
          : "Enter your name, email, and a password (min 6 characters)",
      );
      return;
    }
    const ok = await auth.signup({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    });
    if (ok) {
      nav({ to: "/home" });
      return;
    }
    const msg =
      auth.lastError?.message === "EMAIL_CONFIRMATION_REQUIRED"
        ? t("auth_emailConfirmRequired")
        : auth.phase === "rate_limited"
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
          autoComplete="name"
        />
      </Field>
      <Field label={t("email")}>
        <TextInput
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Field label={t("password")}>
        <div className="relative">
          <TextInput
            type={show ? "text" : "password"}
            dir="ltr"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 end-4 grid place-items-center text-muted-foreground"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </Field>
      <p className="text-xs text-muted-foreground">{t("auth_termsHint")}</p>
      <PrimaryButton disabled={busy} onClick={() => void submit()}>
        {busy ? t("loading") : t("signup")}
      </PrimaryButton>
    </AuthShell>
  );
}
