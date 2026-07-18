import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { useUserActions } from "@/data-access";
import type { OtpChallenge } from "@/domain/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/account/phone")({
  component: ChangePhone,
});

function ChangePhone() {
  const { t } = useI18n();
  const nav = useNavigate();
  const authUi = useAuth();
  const { requestPhoneChange, verifyPhoneChange } = useUserActions();
  const [step, setStep] = useState<"input" | "otp">("input");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = await authUi.getReauthToken();
      if (!token) {
        nav({ to: "/reauth", search: { redirect: "/account/phone" } });
      }
    })();
  }, [authUi, nav]);

  const requestOtp = async () => {
    if (!/^\+?\d{8,15}$/.test(phone.replace(/\s/g, ""))) {
      toast.error(t("account_invalidPhone"));
      return;
    }
    setBusy(true);
    try {
      const result = await requestPhoneChange(phone.replace(/\s/g, ""));
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setChallenge(result.data);
      setStep("otp");
      toast.success(t("account_codeSentSms"));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!challenge) return;
    setBusy(true);
    try {
      const result = await verifyPhoneChange(challenge.id, code);
      if (!result.ok) {
        toast.error(
          result.error.message === "OTP_EXPIRED" ? t("auth_expiredOtp") : t("auth_invalidOtp"),
        );
        return;
      }
      await authUi.clearReauthToken();
      toast.success(t("account_phoneUpdated"));
      nav({ to: "/account" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen>
      <TopBar title={t("account_changePhone")} showBack />
      <ScreenBody>
        <div className="mx-auto mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Phone className="h-6 w-6" />
        </div>

        {step === "input" ? (
          <>
            <label className="mt-6 mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("account_newPhone")}
            </label>
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 w-full rounded-2xl border border-input bg-surface px-4 text-base outline-none focus:border-brand"
              placeholder="+9665XXXXXXXX"
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
              {t("account_enterCodeSentTo")}{" "}
              <span dir="ltr" className="font-mono font-semibold text-foreground">
                {challenge?.destinationMasked ?? phone}
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
              {busy ? "..." : t("verify")}
            </button>
          </>
        )}
      </ScreenBody>
    </MobileScreen>
  );
}
