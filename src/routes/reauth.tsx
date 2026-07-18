import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Fingerprint, Lock } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { useUserActions } from "@/data-access";
import { usePlatform } from "@/platform/PlatformProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/reauth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/account",
  }),
  component: Reauth,
});

/**
 * Fresh re-authentication before sensitive actions.
 * Password verifies identity with AuthRepository; biometrics only unlock a
 * local session lock and are not offered as a backend IdP here.
 */
function Reauth() {
  const { locale, t } = useI18n();
  const isAr = locale === "ar";
  const { redirect } = useSearch({ from: "/reauth" });
  const nav = useNavigate();
  const { reauth } = useUserActions();
  const authUi = useAuth();
  const { localUnlock } = usePlatform();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    void localUnlock.isAvailable().then(setBioAvailable);
  }, [localUnlock]);

  const submit = async () => {
    if (password.length < 6) return;
    setBusy(true);
    try {
      const result = await reauth(password);
      if (!result.ok) {
        toast.error(t("auth_invalidCredentials"));
        return;
      }
      await authUi.storeReauthToken(result.data.token);
      nav({ to: redirect as never });
    } catch {
      toast.error(t("auth_invalidCredentials"));
    } finally {
      setBusy(false);
    }
  };

  const tryLocalUnlock = async () => {
    const result = await authUi.unlockSessionLocally();
    if (result === "unlocked") {
      nav({ to: redirect as never });
      return;
    }
    toast.message(t("auth_localUnlockHere"));
  };

  return (
    <MobileScreen>
      <TopBar title={t("auth_reauthTitle")} showBack />
      <ScreenBody>
        <div className="mx-auto mt-8 flex max-w-sm flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">{t("auth_reauthHeading")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth_reauthBody")}</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            className="mt-6 h-14 w-full rounded-2xl border border-input bg-surface px-4 text-base outline-none focus:border-brand"
            placeholder="••••••••"
          />

          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="mt-4 h-14 w-full rounded-full gradient-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
          >
            {busy ? t("loading") : t("continue")}
          </button>

          {bioAvailable && (
            <button
              type="button"
              onClick={() => void tryLocalUnlock()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold"
            >
              <Fingerprint className="h-4 w-4" />
              {t("auth_localUnlock")}
            </button>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">{t("auth_localUnlockHint")}</p>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
