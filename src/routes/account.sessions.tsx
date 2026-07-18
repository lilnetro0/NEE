import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Smartphone, Monitor, LogOut } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useUserActions, type AuthSession } from "@/data-access";
import { AsyncState } from "@/components/common/AsyncState";
import { toast } from "sonner";

export const Route = createFileRoute("/account/sessions")({
  component: Sessions,
});

function Sessions() {
  const { locale, t } = useI18n();
  const isAr = locale === "ar";
  const { listSessions, revokeSession } = useUserActions();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sessions, setSessions] = useState<AuthSession[]>([]);

  const load = useCallback(() => {
    const controller = new AbortController();
    setStatus("loading");
    void listSessions(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      if (!result.ok) {
        setStatus("error");
        return;
      }
      setSessions(result.data);
      setStatus("ready");
    });
    return () => controller.abort();
  }, [listSessions]);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  const revoke = async (id: string) => {
    const result = await revokeSession(id);
    if (!result.ok) return;
    setSessions((s) => s.filter((x) => x.id !== id));
    toast.success(t("account_sessionRevoked"));
  };

  return (
    <MobileScreen>
      <TopBar title={t("auth_activeSessions")} showBack />
      <ScreenBody>
        <AsyncState
          status={status === "ready" ? (sessions.length === 0 ? "empty" : "ready") : status}
          data={sessions}
          onRetry={load}
        >
          {(list) => (
            <div className="space-y-2">
              {list.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary">
                    {/iphone|ipad|android/i.test(s.device) ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {s.device}
                      {s.current && (
                        <span className="ms-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {t("account_thisDevice")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.location} · {new Date(s.lastActive).toLocaleString(isAr ? "ar" : "en")}
                    </div>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => revoke(s.id)}
                      aria-label={t("account_revoke")}
                      className="grid h-9 w-9 place-items-center rounded-full bg-destructive/15 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </AsyncState>
      </ScreenBody>
    </MobileScreen>
  );
}
