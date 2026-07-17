import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Shield, Scale, Info, ChevronRight } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/legal")({
  component: LegalIndex,
});

function LegalIndex() {
  const { t, dir } = useI18n();
  const items = [
    { icon: FileText, label: "Terms of Service", to: "/legal/terms" },
    { icon: Shield, label: "Privacy Policy", to: "/legal/privacy" },
    { icon: Scale, label: "Refund Policy", to: "/legal/refunds" },
    { icon: Info, label: t("aboutNetro"), to: "/legal/about" },
  ];
  return (
    <MobileScreen>
      <TopBar title={t("legal")} showBack />
      <ScreenBody>
        <div className="overflow-hidden rounded-2xl bg-card">
          {items.map((it, i) => (
            <Link
              key={it.to}
              to={it.to as never}
              className={
                "flex items-center gap-3 px-4 py-4 active:bg-surface " +
                (i > 0 ? "border-t border-border" : "")
              }
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface">
                <it.icon className="h-4 w-4 text-brand" />
              </div>
              <span className="flex-1 text-sm font-semibold">{it.label}</span>
              <ChevronRight
                className={"h-4 w-4 text-muted-foreground " + (dir === "rtl" ? "rotate-180" : "")}
              />
            </Link>
          ))}
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
