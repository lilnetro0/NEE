import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

/** Email + password sign-in. Phone OTP is deferred until SMS is configured. */
function Login() {
  const { t } = useI18n();
  const nav = useNavigate();
  const auth = useAuth();
  const [show, setShow] = useState(false);
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
      default:
        return null;
    }
  };

  const submit = async () => {
    if (!email.includes("@") || password.length < 6) {
      toast.error(t("auth_enterValidCredentials"));
      return;
    }
    const ok = await auth.loginWithPassword(email.trim(), password);
    if (ok) {
      nav({ to: "/home" });
      return;
    }
    toast.error(
      auth.phase === "network_error" ? t("auth_networkError") : t("auth_invalidCredentials"),
    );
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
            autoComplete="current-password"
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

      <div className="flex justify-end text-sm">
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
        {busy ? t("loading") : t("login")}
      </PrimaryButton>

      <p className="text-center text-[11px] text-muted-foreground">{t("auth_socialComingSoon")}</p>
    </AuthShell>
  );
}
