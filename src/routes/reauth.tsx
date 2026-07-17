import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useUserActions } from "@/data-access";
import { secureStorage } from "@/platform/adapters";
import { toast } from "sonner";

export const Route = createFileRoute("/reauth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/account",
  }),
  component: Reauth,
});

/**
 * Fresh password re-authentication before revealing sensitive codes,
 * changing email/phone, deleting the account, etc. The resulting short-lived
 * token is written to secure storage, not localStorage.
 */
function Reauth() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const { redirect } = useSearch({ from: "/reauth" });
  const nav = useNavigate();
  const { reauth } = useUserActions();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 6) return;
    setBusy(true);
    try {
      const result = await reauth(password);
      if (!result.ok) {
        toast.error(isAr ? "كلمة المرور غير صحيحة" : "Incorrect password");
        return;
      }
      await secureStorage.set("reauth", result.data.token);
      nav({ to: redirect });
    } catch {
      toast.error(isAr ? "كلمة المرور غير صحيحة" : "Incorrect password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileScreen>
      <TopBar title={isAr ? "تحقّق من الهوية" : "Confirm it's you"} showBack />
      <ScreenBody>
        <div className="mx-auto mt-8 flex max-w-sm flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">
            {isAr ? "أعد إدخال كلمة المرور" : "Re-enter your password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr
              ? "لحمايتك، نطلب كلمة المرور قبل عرض المعلومات الحساسة."
              : "For your security, we ask for your password before showing sensitive information."}
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            className="mt-6 h-14 w-full rounded-2xl border border-input bg-surface px-4 text-base outline-none focus:border-brand"
            placeholder="••••••••"
          />

          <button
            onClick={submit}
            disabled={busy}
            className="mt-4 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
          >
            {busy ? (isAr ? "جاري التحقق..." : "Verifying...") : isAr ? "متابعة" : "Continue"}
          </button>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
