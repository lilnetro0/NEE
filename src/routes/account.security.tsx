import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { KeyRound, Fingerprint, Smartphone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/security")({
  component: Security,
});

function Security() {
  const { t } = useI18n();
  const [tfa, setTfa] = useState(true);
  const [bio, setBio] = useState(true);
  return (
    <MobileScreen>
      <TopBar title={t("security")} showBack showCart={false} />
      <ScreenBody className="space-y-3">
        {[
          { icon: ShieldCheck, label: "Two-Factor Authentication", desc: "Extra layer via SMS", value: tfa, on: () => setTfa(!tfa) },
          { icon: Fingerprint, label: "Biometric login", desc: "Face ID / Touch ID", value: bio, on: () => setBio(!bio) },
        ].map((it) => (
          <div key={it.label} className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface"><it.icon className="h-5 w-5 text-brand" /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{it.label}</div>
              <div className="text-xs text-muted-foreground">{it.desc}</div>
            </div>
            <button onClick={it.on} className={cn("h-6 w-11 rounded-full transition-colors", it.value ? "bg-brand" : "bg-muted")}>
              <span className={cn("block h-5 w-5 rounded-full bg-white transition-transform", it.value ? "translate-x-5" : "translate-x-0.5")} />
            </button>
          </div>
        ))}
        <button className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface"><KeyRound className="h-5 w-5 text-brand" /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Change password</div>
            <div className="text-xs text-muted-foreground">Last changed 3 months ago</div>
          </div>
        </button>
        <button className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface"><Smartphone className="h-5 w-5 text-brand" /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Trusted devices</div>
            <div className="text-xs text-muted-foreground">2 devices signed in</div>
          </div>
        </button>
      </ScreenBody>
    </MobileScreen>
  );
}
