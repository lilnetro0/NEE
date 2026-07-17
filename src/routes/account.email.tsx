import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { useUserActions } from "@/data-access";
import type { OtpChallenge } from "@/domain/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/account/email")({
  component: ChangeEmail,
});

function ChangeEmail() {
  const { locale, t } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const authUi = useAuth();
  const { requestEmailChange, verifyEmailChange } = useUserActions();
  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = await authUi.getReauthToken();
      if (!token) {
        nav({ to: "/reauth", search: { redirect: "/account/email" } });
      }
    })();
  }, [authUi, nav]);

  const requestOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(isAr ? "بريد غير صالح" : "Invalid email");
      return;
    }
    setBusy(true);
    try {
      const result = await requestEmailChange(email);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setChallenge(result.data);
      setStep("otp");
      toast.success(isAr ? "أرسلنا رمزاً إلى بريدك" : "We sent a verification code");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!challenge) return;
    setBusy(true);
    try {
      const result = await verifyEmailChange(challenge.id, code);
      if (!result.ok) {
        toast.error(
          result.error.message === "OTP_EXPIRED" ? t("auth_expiredOtp") : t("auth_invalidOtp"),
        );
        return;
      }
      await authUi.clearReauthToken();
      toast.success(isAr ? "تم تحديث البريد" : "Email updated");
      nav({ to: "/account" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen>
      <TopBar title={isAr ? "تغيير البريد" : "Change email"} showBack />
      <ScreenBody>
        <div className="mx-auto mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Mail className="h-6 w-6" />
        </div>

        {step === "input" ? (
          <>
            <label className="mt-6 mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {isAr ? "البريد الجديد" : "New email"}
            </label>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 w-full rounded-2xl border border-input bg-surface px-4 text-base outline-none focus:border-brand"
              placeholder="you@example.com"
            />
            <button
              type="button"
              onClick={() => void requestOtp()}
              disabled={busy}
              className="mt-6 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
            >
              {busy ? "..." : t("auth_sendCode")}
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isAr ? "أدخل الرمز المرسل إلى" : "Enter the code sent to"}{" "}
              <span dir="ltr" className="font-mono font-semibold text-foreground">
                {challenge?.destinationMasked ?? email}
              </span>
            </p>
            <input
              inputMode="numeric"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-6 h-16 w-full rounded-2xl border border-input bg-surface text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-brand"
              placeholder="000000"
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t("auth_otpHint")}
            </p>
            <button
              type="button"
              onClick={() => void verify()}
              disabled={busy || code.length !== 6}
              className="mt-6 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
            >
              {busy ? "..." : isAr ? "تأكيد" : "Verify"}
            </button>
          </>
        )}
      </ScreenBody>
    </MobileScreen>
  );
}
