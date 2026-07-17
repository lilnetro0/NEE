import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Monitor, LogOut } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { authApi } from "@/api/services";
import { AsyncState } from "@/components/common/AsyncState";
import { toast } from "sonner";

export const Route = createFileRoute("/account/sessions")({
  component: Sessions,
});

type Session = Awaited<ReturnType<typeof authApi.listSessions>>[number];

function Sessions() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sessions, setSessions] = useState<Session[]>([]);

  const load = () => {
    setStatus("loading");
    authApi.listSessions().then((s) => {
      setSessions(s);
      setStatus("ready");
    }).catch(() => setStatus("error"));
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    await authApi.revokeSession(id);
    setSessions((s) => s.filter((x) => x.id !== id));
    toast.success(isAr ? "تم إنهاء الجلسة" : "Session revoked");
  };

  return (
    <MobileScreen>
      <TopBar title={isAr ? "الجلسات النشطة" : "Active sessions"} showBack />
      <ScreenBody>
        <AsyncState status={status === "ready" ? (sessions.length === 0 ? "empty" : "ready") : status} data={sessions} onRetry={load}>
          {(list) => (
            <div className="space-y-2">
              {list.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary">
                    {/iphone|ipad|android/i.test(s.device) ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {s.device}
                      {s.current && <span className="ms-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">{isAr ? "الحالي" : "This device"}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.location} · {new Date(s.lastActive).toLocaleString(isAr ? "ar" : "en")}
                    </div>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => revoke(s.id)}
                      aria-label={isAr ? "إنهاء" : "Revoke"}
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
