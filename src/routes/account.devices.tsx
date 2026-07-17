import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { device } from "@/platform/adapters";

export const Route = createFileRoute("/account/devices")({
  component: Devices,
});

function Devices() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const info = device.info();

  return (
    <MobileScreen>
      <TopBar title={isAr ? "الأجهزة" : "Devices"} showBack />
      <ScreenBody>
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {isAr ? "الجهاز الحالي" : "Current device"}
              </div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {info.platform} · {info.osVersion} · {info.appVersion}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Row label={isAr ? "المنصة" : "Platform"} value={info.platform} />
            <Row label={isAr ? "اللغة" : "Locale"} value={info.locale} />
            <Row label={isAr ? "إصدار التطبيق" : "App version"} value={info.appVersion} />
            <Row label={isAr ? "إصدار النظام" : "OS version"} value={info.osVersion} />
          </div>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-xs font-semibold" dir="ltr">{value}</div>
    </div>
  );
}
