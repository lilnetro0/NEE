import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Phone } from "lucide-react";
import { AuthShell, Field, TextInput, PrimaryButton, OrDivider } from "@/components/auth/AuthShell";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [show, setShow] = useState(false);

  return (
    <AuthShell
      title={t("login")}
      subtitle={t("welcome")}
      footer={
        <div className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/auth/signup" className="font-semibold text-brand">{t("signup")}</Link>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
        {(["email", "phone"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors",
              mode === m ? "bg-background text-foreground shadow-card" : "text-muted-foreground",
            )}
          >
            {m === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            {t(m as "email" | "phone")}
          </button>
        ))}
      </div>

      <Field label={mode === "email" ? t("email") : t("phone")}>
        <TextInput
          type={mode === "email" ? "email" : "tel"}
          placeholder={mode === "email" ? "you@example.com" : "+966 5X XXX XXXX"}
        />
      </Field>

      <Field label={t("password")}>
        <div className="relative">
          <TextInput type={show ? "text" : "password"} placeholder="••••••••" />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 end-4 grid place-items-center text-muted-foreground"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 rounded accent-[color:var(--brand)]" />
          <span className="text-muted-foreground">{t("rememberMe")}</span>
        </label>
        <Link to="/auth/forgot" className="font-semibold text-brand">{t("forgot")}</Link>
      </div>

      <PrimaryButton onClick={() => (mode === "phone" ? nav({ to: "/auth/otp" }) : nav({ to: "/home" }))}>
        {t("login")}
      </PrimaryButton>

      <OrDivider label="—" />

      <div className="grid grid-cols-3 gap-2">
        {["Apple", "Google", "X"].map((s) => (
          <button key={s} className="h-12 rounded-2xl border border-input bg-surface text-sm font-semibold active:scale-95">
            {s}
          </button>
        ))}
      </div>
    </AuthShell>
  );
}
