import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthShell, PrimaryButton } from "@/components/auth/AuthShell";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/otp")({
  component: Otp,
});

function Otp() {
  const { t } = useI18n();
  const nav = useNavigate();
  const auth = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    if (!auth.challenge && auth.phase !== "loading" && auth.phase !== "booting") {
      nav({ to: "/auth/login" });
    }
  }, [auth.challenge, auth.phase, nav]);

  useEffect(() => {
    if (auth.challenge?.resendAvailableAt) {
      const ms = Math.max(0, Date.parse(auth.challenge.resendAvailableAt) - Date.now());
      setSeconds(Math.ceil(ms / 1000) || 45);
    }
  }, [auth.challenge?.id, auth.challenge?.resendAvailableAt]);

  useEffect(() => {
    if (!seconds) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const copy = [...prev];
      copy[i] = clean;
      return copy;
    });
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const full = digits.every((d) => d);
  const busy = auth.phase === "loading";

  const errorCopy = (): string | null => {
    switch (auth.phase) {
      case "invalid_otp":
        return t("auth_invalidOtp");
      case "expired_otp":
        return t("auth_expiredOtp");
      case "rate_limited":
        return t("auth_rateLimited");
      case "network_error":
        return t("auth_networkError");
      default:
        return null;
    }
  };

  const confirm = async () => {
    const code = digits.join("");
    const ok = await auth.verifyPhoneOtp(code);
    if (ok) {
      nav({ to: "/home" });
      return;
    }
    if (auth.phase === "invalid_otp") {
      setDigits(Array(6).fill(""));
      refs.current[0]?.focus();
    }
  };

  const resend = async () => {
    const ok = await auth.resendPhoneOtp();
    if (ok) {
      setSeconds(45);
      toast.success(t("auth_codeResent"));
      return;
    }
    toast.error(errorCopy() ?? t("auth_networkError"));
  };

  return (
    <AuthShell
      title={t("otpTitle")}
      subtitle={
        auth.challenge ? `${t("otpDesc")} ${auth.challenge.destinationMasked}` : t("otpDesc")
      }
      footer={
        <div className="text-center text-sm text-muted-foreground">
          {seconds > 0 ? (
            `${t("resend")} · 0:${String(seconds).padStart(2, "0")}`
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void resend()}
              className="font-semibold text-brand"
            >
              {t("resend")}
            </button>
          )}
        </div>
      }
    >
      <div className="flex justify-between gap-2" dir="ltr">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={busy}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            className={cn(
              "h-14 w-12 rounded-2xl border-2 bg-surface text-center font-display text-2xl font-bold outline-none",
              d ? "border-brand" : "border-input",
              auth.phase === "invalid_otp" && "border-destructive",
            )}
          />
        ))}
      </div>

      {errorCopy() && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
          {errorCopy()}
        </p>
      )}

      <p className="text-center text-[11px] text-muted-foreground">{t("auth_otpHint")}</p>

      <PrimaryButton disabled={!full || busy} onClick={() => void confirm()}>
        {busy ? t("loading") : t("confirm")}
      </PrimaryButton>
    </AuthShell>
  );
}
