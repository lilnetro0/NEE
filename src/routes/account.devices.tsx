import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { usePlatform } from "@/platform/PlatformProvider";
import type { DeviceInformation } from "@/platform/contracts";

export const Route = createFileRoute("/account/devices")({
  component: Devices,
});

function Devices() {
  const { t } = useI18n();
  const { device, appVersion } = usePlatform();
  const [info, setInfo] = useState<DeviceInformation>({
    platform: "web",
    operatingSystem: "web",
    osVersion: "web",
    locale: "en",
  });
  const [version, setVersion] = useState("1.0.0");

  useEffect(() => {
    let active = true;
    void Promise.all([device.getInfo(), appVersion.getInfo()]).then(([deviceInfo, appInfo]) => {
      if (!active) return;
      setInfo(deviceInfo);
      setVersion(appInfo.version);
    });
    return () => {
      active = false;
    };
  }, [appVersion, device]);

  return (
    <MobileScreen>
      <TopBar title={t("account_devices")} showBack />
      <ScreenBody>
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold">{t("account_currentDevice")}</div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {info.platform} · {info.osVersion} · {version}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Row label={t("platform")} value={info.platform} />
            <Row label={t("account_locale")} value={info.locale} />
            <Row label={t("account_appVersion")} value={version} />
            <Row label={t("account_osVersion")} value={info.osVersion} />
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
      <div className="mt-0.5 font-mono text-xs font-semibold" dir="ltr">
        {value}
      </div>
    </div>
  );
}
