import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Mail, PhoneCall } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/dictionaries";

export const Route = createFileRoute("/support")({
  component: Support,
});

const FAQ_KEYS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: "support_faq_delivery_q", a: "support_faq_delivery_a" },
  { q: "support_faq_code_q", a: "support_faq_code_a" },
  { q: "support_faq_refund_q", a: "support_faq_refund_a" },
  { q: "support_faq_regions_q", a: "support_faq_regions_a" },
  { q: "support_faq_redeem_q", a: "support_faq_redeem_a" },
];

function Support() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <MobileScreen>
      <TopBar title={t("supportCenter")} showBack />
      <ScreenBody>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: MessageCircle, label: t("liveChat") },
            { icon: Mail, label: t("createTicket"), to: "/support/new" as const },
            { icon: PhoneCall, label: t("support_callUs") },
          ].map((c) =>
            c.to ? (
              <Link
                key={c.label}
                to={c.to}
                search={{ orderId: undefined, itemId: undefined }}
                className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
                  <c.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold">{c.label}</span>
              </Link>
            ) : (
              <button
                key={c.label}
                type="button"
                className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
                  <c.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold">{c.label}</span>
              </button>
            ),
          )}
        </div>

        <h3 className="mb-2 mt-6 flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          <HelpCircle className="h-4 w-4" /> {t("faq")}
        </h3>
        <div className="space-y-2">
          {FAQ_KEYS.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-2xl bg-card">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-sm font-semibold">{t(f.q)}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    open === i && "rotate-180",
                  )}
                />
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground">
                  {t(f.a)}
                </div>
              )}
            </div>
          ))}
        </div>

        <Link to="/legal" className="mt-6 block text-center text-xs font-semibold text-brand">
          {t("legal")}
        </Link>
      </ScreenBody>
    </MobileScreen>
  );
}
