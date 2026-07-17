import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { authApi } from "@/api/services";
import { toast } from "sonner";

export const Route = createFileRoute("/account/email")({
  component: ChangeEmail,
});

function ChangeEmail() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const nav = useNavigate();
  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(isAr ? "بريد غير صالح" : "Invalid email");
      return;
    }
    setBusy(true);
    try {
      await authApi.requestEmailChange(email);
      setStep("otp");
      toast.success(isAr ? "أرسلنا رمزاً إلى بريدك" : "We sent a verification code");
    } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true);
    try {
      await authApi.verifyEmailChange(code);
      toast.success(isAr ? "تم تحديث البريد" : "Email updated");
      nav({ to: "/account" });
    } catch {
      toast.error(isAr ? "الرمز غير صحيح" : "Invalid code");
    } finally { setBusy(false); }
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
            <button onClick={requestOtp} disabled={busy} className="mt-6 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50">
              {busy ? "..." : isAr ? "إرسال الرمز" : "Send code"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isAr ? "أدخل الرمز المرسل إلى" : "Enter the code sent to"}{" "}
              <span dir="ltr" className="font-mono font-semibold text-foreground">{email}</span>
            </p>
            <input
              inputMode="numeric"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-6 h-16 w-full rounded-2xl border border-input bg-surface text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-brand"
              placeholder="000000"
            />
            <button onClick={verify} disabled={busy || code.length !== 6} className="mt-6 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50">
              {busy ? "..." : isAr ? "تأكيد" : "Verify"}
            </button>
          </>
        )}
      </ScreenBody>
    </MobileScreen>
  );
}
