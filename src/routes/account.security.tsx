import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { usePlatform } from "@/platform/PlatformProvider";
import { KeyRound, Fingerprint, Smartphone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/account/security")({
  component: Security,
});

/**
 * Security preferences. Biometrics toggle controls local session unlock only —
 * it is never treated as a backend identity provider.
 */
function Security() {
  const { t } = useI18n();
  const { localUnlock } = usePlatform();
  const [tfa, setTfa] = useState(false);
  const [bio, setBio] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    void (async () => {
      setBioAvailable(await localUnlock.isAvailable());
      setBio(await localUnlock.isEnabled());
    })();
  }, [localUnlock]);

  const toggleBio = async () => {
    const next = !bio;
    if (next && !bioAvailable) {
      toast.message(t("auth_localUnlockUnavailable"));
      // Still allow enabling the preference for native shells that will honor it.
    }
    await localUnlock.setEnabled(next);
    setBio(next);
  };

  return (
    <MobileScreen>
      <TopBar title={t("security")} showBack showCart={false} />
      <ScreenBody className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
            <ShieldCheck className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("auth_twoFactor")}</div>
            <div className="text-xs text-muted-foreground">{t("auth_twoFactorDesc")}</div>
          </div>
          <button
            type="button"
            onClick={() => setTfa(!tfa)}
            className={cn("h-6 w-11 rounded-full transition-colors", tfa ? "bg-brand" : "bg-muted")}
          >
            <span
              className={cn(
                "block h-5 w-5 rounded-full bg-white transition-transform",
                tfa ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
            <Fingerprint className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("auth_localUnlock")}</div>
            <div className="text-xs text-muted-foreground">{t("auth_localUnlockHint")}</div>
          </div>
          <button
            type="button"
            onClick={() => void toggleBio()}
            className={cn("h-6 w-11 rounded-full transition-colors", bio ? "bg-brand" : "bg-muted")}
          >
            <span
              className={cn(
                "block h-5 w-5 rounded-full bg-white transition-transform",
                bio ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        <Link
          to="/auth/forgot"
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
            <KeyRound className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("resetPassword")}</div>
            <div className="text-xs text-muted-foreground">{t("account_resetHint")}</div>
          </div>
        </Link>

        <Link
          to="/account/sessions"
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
            <Smartphone className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("auth_activeSessions")}</div>
            <div className="text-xs text-muted-foreground">{t("auth_activeSessionsDesc")}</div>
          </div>
        </Link>
      </ScreenBody>
    </MobileScreen>
  );
}
