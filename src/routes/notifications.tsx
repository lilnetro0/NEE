import { createFileRoute } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useNotifications } from "@/data-access";
import { useI18n } from "@/i18n/I18nProvider";
import { Bell, Package, Tag, Shield, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const iconFor = { order: Package, promo: Tag, security: Shield, support: LifeBuoy };

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

function Notifications() {
  const { t, locale } = useI18n();
  const { data: notifications = [] } = useNotifications();
  return (
    <MobileScreen>
      <TopBar title={t("notifications")} showBack showNotif={false} />
      <ScreenBody>
        {notifications.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t("empty_notifications")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = iconFor[n.type];
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 rounded-2xl p-4",
                    n.read ? "bg-card" : "bg-brand/5 border border-brand/20",
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{n.title[locale]}</div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{n.body[locale]}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.time).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScreenBody>
    </MobileScreen>
  );
}
