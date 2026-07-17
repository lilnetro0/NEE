import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/region")({
  component: Region,
});

const regions = [
  { id: "sa", label: "Saudi Arabia", code: "KSA", cur: "SAR", flag: "🇸🇦" },
  { id: "ae", label: "United Arab Emirates", code: "UAE", cur: "AED", flag: "🇦🇪" },
  { id: "kw", label: "Kuwait", code: "KW", cur: "KWD", flag: "🇰🇼" },
  { id: "qa", label: "Qatar", code: "QA", cur: "QAR", flag: "🇶🇦" },
  { id: "bh", label: "Bahrain", code: "BH", cur: "BHD", flag: "🇧🇭" },
  { id: "om", label: "Oman", code: "OM", cur: "OMR", flag: "🇴🇲" },
  { id: "eg", label: "Egypt", code: "EG", cur: "EGP", flag: "🇪🇬" },
  { id: "global", label: "Global", code: "GLB", cur: "USD", flag: "🌐" },
];

function Region() {
  const { t } = useI18n();
  const [sel, setSel] = useState("sa");
  return (
    <MobileScreen>
      <TopBar title={t("region")} showBack showCart={false} />
      <ScreenBody className="space-y-2">
        {regions.map((r) => (
          <button
            key={r.id}
            onClick={() => setSel(r.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border-2 p-4",
              sel === r.id ? "border-brand bg-brand/10" : "border-input bg-card",
            )}
          >
            <span className="text-2xl">{r.flag}</span>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold">{r.label}</div>
              <div className="text-xs text-muted-foreground">
                {r.code} · {r.cur}
              </div>
            </div>
            {sel === r.id && <Check className="h-5 w-5 text-brand" />}
          </button>
        ))}
      </ScreenBody>
    </MobileScreen>
  );
}
