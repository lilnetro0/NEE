import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Apple, Smartphone } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import { useCapabilities } from "@/platform/useCapabilities";
import { CapabilityDisabledScreen } from "@/platform/CapabilityDisabled";

export const Route = createFileRoute("/account/payment")({
  component: Payment,
});

function Payment() {
  const { t } = useI18n();
  const { isEnabled } = useCapabilities();

  if (!isEnabled("savedPaymentMethodsEnabled")) {
    return <CapabilityDisabledScreen capability="savedPaymentMethodsEnabled" />;
  }

  const cards = [
    { id: "1", brand: "Mada", last: "4421", exp: "05/28", color: "#0e7c66" },
    { id: "2", brand: "Visa", last: "8871", exp: "11/27", color: "#1a1f71" },
  ];
  return (
    <MobileScreen>
      <TopBar title={t("paymentMethods")} showBack showCart={false} />
      <ScreenBody className="space-y-3">
        {cards.map((c) => (
          <div
            key={c.id}
            className="relative overflow-hidden rounded-3xl p-5 text-white shadow-elevated"
            style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}bb)` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-black tracking-widest">{c.brand}</span>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 font-mono text-lg tracking-widest">•••• •••• •••• {c.last}</div>
            <div className="mt-2 flex justify-between text-xs opacity-80">
              <span>Ahmad Al-Sayed</span>
              <span>{c.exp}</span>
            </div>
          </div>
        ))}
        <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-input bg-surface p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
            <Plus className="h-5 w-5" />
          </div>
          <span className="font-semibold">Add new card</span>
        </button>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
              <Apple className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Apple Pay</div>
              <div className="text-xs text-muted-foreground">Ready to use</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">STC Pay</div>
              <div className="text-xs text-muted-foreground">Link account</div>
            </div>
          </div>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}
