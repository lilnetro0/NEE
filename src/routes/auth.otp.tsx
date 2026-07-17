import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthShell, PrimaryButton } from "@/components/auth/AuthShell";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/otp")({
  component: Otp,
});

function Otp() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    if (!seconds) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
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

  return (
    <AuthShell
      title={t("otpTitle")}
      subtitle={t("otpDesc")}
      footer={
        <div className="text-center text-sm text-muted-foreground">
          {seconds > 0 ? `${t("resend")} · 0:${String(seconds).padStart(2, "0")}` : (
            <button onClick={() => setSeconds(45)} className="font-semibold text-brand">{t("resend")}</button>
          )}
        </div>
      }
    >
      <div className="flex justify-between gap-2" dir="ltr">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            className={cn(
              "h-14 w-12 rounded-2xl border-2 bg-surface text-center font-display text-2xl font-bold outline-none",
              d ? "border-brand" : "border-input",
            )}
          />
        ))}
      </div>
      <PrimaryButton disabled={!full} onClick={() => nav({ to: "/home" })}>
        {t("confirm")}
      </PrimaryButton>
    </AuthShell>
  );
}
