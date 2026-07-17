import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Phone } from "lucide-react";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

/**
 * Phone OTP is primary. Email is secondary identity; password is optional.
 * Social buttons are placeholders only — not wired to any IdP.
 */
function Login() {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [usePassword, setUsePassword] = useState(false);
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const busy = auth.phase === "loading" || auth.phase === "booting";

  const phaseMessage = (): string | null => {
    switch (auth.phase) {
      case "network_error":
        return t("auth_networkError");
      case "rate_limited":
        return t("auth_rateLimited");
      case "session_expired":
        return t("auth_sessionExpired");
      case "invalid_otp":
        return t("auth_invalidOtp");
      default:
        return auth.lastError && !usePassword ? auth.lastError.message : null;
    }
  };

  const submit = async () => {
    if (usePassword) {
      const identifier = mode === "email" ? email.trim() : phone.trim();
      if (!identifier || password.length < 6) {
        toast.error(isAr ? "أدخل بيانات صحيحة" : "Enter valid credentials");
        return;
      }
      const ok = await auth.loginWithPassword(identifier, password);
      if (ok) {
        nav({ to: "/home" });
        return;
      }
      toast.error(
        auth.phase === "network_error" ? t("auth_networkError") : t("auth_invalidCredentials"),
      );
      return;
    }

    if (mode === "phone") {
      if (!/^\+?\d{8,15}$/.test(phone.replace(/\s/g, ""))) {
        toast.error(isAr ? "رقم غير صالح" : "Invalid phone number");
        return;
      }
      const ok = await auth.requestPhoneOtp(phone.replace(/\s/g, ""), "login");
      if (ok) {
        nav({ to: "/auth/otp" });
        return;
      }
      toast.error(phaseMessage() ?? t("auth_networkError"));
      return;
    }

    // Email without password → prompt to use password path (secondary)
    toast.message(
      isAr
        ? "استخدم كلمة المرور لتسجيل الدخول بالبريد، أو سجّل الدخول برقم الجوال."
        : "Use a password to sign in with email, or continue with phone OTP.",
    );
    setUsePassword(true);
  };

  return (
    <AuthShell
      title={t("login")}
      subtitle={t("auth_loginSubtitle")}
      footer={
        <div className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/auth/signup" className="font-semibold text-brand">
            {t("signup")}
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
        {(["phone", "email"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors",
              mode === m ? "bg-background text-foreground shadow-card" : "text-muted-foreground",
            )}
          >
            {m === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            {t(m)}
          </button>
        ))}
      </div>

      <Field label={mode === "email" ? t("email") : t("phone")}>
        <TextInput
          type={mode === "email" ? "email" : "tel"}
          dir="ltr"
          value={mode === "email" ? email : phone}
          onChange={(e) => (mode === "email" ? setEmail(e.target.value) : setPhone(e.target.value))}
          placeholder={mode === "email" ? "you@example.com" : "+966 5X XXX XXXX"}
        />
      </Field>

      {usePassword && (
        <Field label={t("password")}>
          <div className="relative">
            <TextInput
              type={show ? "text" : "password"}
              dir="ltr"
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
      )}

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setUsePassword((v) => !v)}
          className="font-semibold text-brand"
        >
          {usePassword ? t("auth_useOtpInstead") : t("auth_usePasswordOptional")}
        </button>
        <Link to="/auth/forgot" className="font-semibold text-muted-foreground">
          {t("forgot")}
        </Link>
      </div>

      {phaseMessage() && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
          {phaseMessage()}
        </p>
      )}

      <PrimaryButton disabled={busy} onClick={() => void submit()}>
        {busy ? t("loading") : mode === "phone" && !usePassword ? t("auth_sendCode") : t("login")}
      </PrimaryButton>

      <p className="text-center text-[11px] text-muted-foreground">{t("auth_socialComingSoon")}</p>
    </AuthShell>
  );
}
