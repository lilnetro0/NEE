import { Ban } from "lucide-react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { useI18n } from "@/i18n/I18nProvider";
import type { CapabilityId } from "./capabilities";

const COPY: Record<
  CapabilityId,
  { title: { en: string; ar: string }; message: { en: string; ar: string } }
> = {
  purchasingEnabled: {
    title: { en: "Purchasing unavailable", ar: "الشراء غير متاح" },
    message: {
      en: "Checkout is temporarily unavailable while payment integration is completed. You can still browse the catalog, manage your account, and use support.",
      ar: "إتمام الشراء غير متاح مؤقتاً حتى اكتمال دمج بوابة الدفع. يمكنك تصفح المنتجات وإدارة حسابك واستخدام الدعم.",
    },
  },
  externalPaymentsEnabled: {
    title: { en: "External payments unavailable", ar: "الدفع الخارجي غير متاح" },
    message: {
      en: "Card and wallet payments will be available after payment provider integration.",
      ar: "الدفع بالبطاقات والمحافظ سيتاح بعد ربط مزود الدفع.",
    },
  },
  giftCardPurchaseEnabled: {
    title: { en: "Gift cards unavailable", ar: "بطاقات الهدايا غير متاحة" },
    message: {
      en: "Gift card purchases are currently disabled for your market.",
      ar: "شراء بطاقات الهدايا متوقف حالياً في سوقك.",
    },
  },
  directGameTopUpEnabled: {
    title: { en: "Game top-ups unavailable", ar: "شحن الألعاب غير متاح" },
    message: {
      en: "Direct game top-ups are currently disabled for your market.",
      ar: "شحن الألعاب المباشر متوقف حالياً في سوقك.",
    },
  },
  walletFundingEnabled: {
    title: { en: "Funding unavailable", ar: "التعبئة غير متاحة" },
    message: {
      en: "NETRO Store Credit cannot be deposited or withdrawn. Credit is issued as refunds or promotions only.",
      ar: "لا يمكن إيداع أو سحب رصيد متجر NETRO. يُمنح الرصيد كاسترداد أو عروض فقط.",
    },
  },
  storeCreditEnabled: {
    title: { en: "Store credit unavailable", ar: "رصيد المتجر غير متاح" },
    message: {
      en: "NETRO Store Credit is not available in your market right now.",
      ar: "رصيد متجر NETRO غير متاح في سوقك حالياً.",
    },
  },
  savedPaymentMethodsEnabled: {
    title: { en: "Saved payments unavailable", ar: "طرق الدفع المحفوظة غير متاحة" },
    message: {
      en: "Managing saved payment methods is currently disabled.",
      ar: "إدارة طرق الدفع المحفوظة متوقفة حالياً.",
    },
  },
  referralsEnabled: {
    title: { en: "Referrals unavailable", ar: "الإحالات غير متاحة" },
    message: {
      en: "Referral rewards are not available in your market yet.",
      ar: "مكافآت الإحالات غير متاحة في سوقك بعد.",
    },
  },
  promotionsEnabled: {
    title: { en: "Promotions unavailable", ar: "العروض غير متاحة" },
    message: {
      en: "Promotions are currently disabled for your market.",
      ar: "العروض متوقفة حالياً في سوقك.",
    },
  },
};

/** Full-screen explanatory state when a capability is off. */
export function CapabilityDisabledScreen({
  capability,
  showBack = true,
}: {
  capability: CapabilityId;
  showBack?: boolean;
}) {
  const { locale } = useI18n();
  const copy = COPY[capability];
  return (
    <MobileScreen>
      <TopBar title="" showBack={showBack} showCart={false} />
      <ScreenBody>
        <CapabilityDisabledPanel capability={capability} />
        <p className="sr-only">
          {copy.title[locale]} — {copy.message[locale]}
        </p>
      </ScreenBody>
    </MobileScreen>
  );
}

/** Inline panel for sticky CTAs and nested sections. */
export function CapabilityDisabledPanel({ capability }: { capability: CapabilityId }) {
  const { locale } = useI18n();
  const copy = COPY[capability];
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-muted-foreground">
        <Ban className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold">{copy.title[locale]}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{copy.message[locale]}</p>
    </div>
  );
}

export function capabilityDisabledCopy(capability: CapabilityId, locale: "en" | "ar") {
  const copy = COPY[capability];
  return {
    title: copy.title[locale],
    message: copy.message[locale],
  };
}
