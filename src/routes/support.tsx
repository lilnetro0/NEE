import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Mail, PhoneCall } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/support")({
  component: Support,
});

const faqs = [
  { q: "How fast is delivery?", a: "Most orders are delivered instantly to your email. Some manual reviews can take up to 15 minutes." },
  { q: "What if my code doesn't work?", a: "Contact support with your order ID and a screenshot within 24 hours for a replacement." },
  { q: "Can I get a refund?", a: "Unused codes are eligible for refund per our policy. Top-ups with wrong Player IDs cannot be refunded." },
  { q: "Which regions are supported?", a: "We support KSA, UAE, EG, KW, QA, BH, OM, and Global codes." },
  { q: "How to redeem a gift card?", a: "Each product page has step-by-step redemption instructions under 'How to redeem'." },
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
            { icon: MessageCircle, label: t("liveChat"), color: "brand" },
            { icon: Mail, label: t("createTicket"), color: "violet" },
            { icon: PhoneCall, label: "Call us", color: "cyan" },
          ].map((c) => (
            <button key={c.label} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand"><c.icon className="h-5 w-5" /></div>
              <span className="text-[11px] font-semibold">{c.label}</span>
            </button>
          ))}
        </div>

        <h3 className="mb-2 mt-6 flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          <HelpCircle className="h-4 w-4" /> {t("faq")}
        </h3>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-card">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <span className="text-sm font-semibold">{f.q}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open === i && "rotate-180")} />
              </button>
              {open === i && <div className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground">{f.a}</div>}
            </div>
          ))}
        </div>

        <Link to="/legal" className="mt-6 block text-center text-xs font-semibold text-brand">{t("legal")}</Link>
      </ScreenBody>
    </MobileScreen>
  );
}
