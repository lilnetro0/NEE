import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User,
  ShieldCheck,
  Bell,
  Heart,
  CreditCard,
  Languages,
  Palette,
  HelpCircle,
  FileText,
  Info,
  LogOut,
  Wallet,
  Ticket,
  ChevronRight,
  Globe2,
  Package,
  AlertCircle,
  Smartphone,
  Phone,
  Mail,
} from "lucide-react";
import { MobileScreen, TopBar, ScreenBody, BottomNav } from "@/components/shell/Shell";
import { useCurrentUser } from "@/data-access";
import { useAuth } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { useCapabilities } from "@/platform/useCapabilities";
import { isDevToolsEnabled } from "@/config/env";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  component: AccountRoute,
});

function AccountRoute() {
  return (
    <RequireAuth>
      <Account />
    </RequireAuth>
  );
}

function Account() {
  const { t, locale, dir } = useI18n();
  const { data: user } = useCurrentUser();
  const { isEnabled } = useCapabilities();
  const auth = useAuth();
  const nav = useNavigate();
  const displayName = auth.user?.displayName ?? user?.displayName ?? "";
  const email = auth.user?.email ?? user?.email ?? "";
  const initial = (displayName || email || "?").slice(0, 1).toUpperCase();
  const moneyItems: { icon: typeof User; label: string; to: string; sub?: string }[] = [];
  if (isEnabled("storeCreditEnabled")) {
    moneyItems.push({
      icon: Wallet,
      label: t("storeCredit"),
      to: "/wallet",
      sub: "SAR 120.00",
    });
  }
  if (isEnabled("savedPaymentMethodsEnabled")) {
    moneyItems.push({
      icon: CreditCard,
      label: t("paymentMethods"),
      to: "/account/payment",
    });
  }
  if (isEnabled("promotionsEnabled")) {
    moneyItems.push({
      icon: Ticket,
      label: t("promotions"),
      to: "/account/promotions",
    });
  }

  const groups: {
    title: string;
    items: { icon: typeof User; label: string; to: string; sub?: string }[];
  }[] = [
    {
      title: t("profile"),
      items: [
        { icon: User, label: t("profile"), to: "/account/profile" },
        { icon: ShieldCheck, label: t("security"), to: "/account/security" },
        { icon: Smartphone, label: t("auth_activeSessions"), to: "/account/sessions" },
        { icon: Phone, label: t("phone"), to: "/account/phone" },
        { icon: Mail, label: t("email"), to: "/account/email" },
        { icon: Bell, label: t("notifications"), to: "/notifications" },
        { icon: Heart, label: t("favorites"), to: "/favorites" },
      ],
    },
    ...(moneyItems.length > 0
      ? [
          {
            title: locale === "ar" ? "المال" : "Money",
            items: moneyItems,
          },
        ]
      : []),
    {
      title: t("appearance"),
      items: [
        {
          icon: Languages,
          label: t("language"),
          to: "/account/language",
          sub: locale === "ar" ? "العربية" : "English",
        },
        { icon: Palette, label: t("appearance"), to: "/account/appearance" },
        { icon: Globe2, label: t("region"), to: "/account/region", sub: "🇸🇦 KSA · SAR" },
      ],
    },
    {
      title: t("supportCenter"),
      items: [
        { icon: HelpCircle, label: t("supportCenter"), to: "/support" },
        { icon: FileText, label: t("legal"), to: "/legal" },
        { icon: Info, label: t("aboutNetro"), to: "/legal/about" },
      ],
    },
    ...(isDevToolsEnabled()
      ? [
          {
            title: "Dev",
            items: [
              {
                icon: Package,
                label: t("orderScenarios"),
                to: "/dev/order-scenarios",
              },
              {
                icon: AlertCircle,
                label: t("operationalStates"),
                to: "/dev/operational-states",
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <MobileScreen>
      <TopBar title={t("nav_account")} showCart={false} />
      <ScreenBody>
        <div className="flex items-center gap-3 rounded-3xl gradient-hero p-4 text-white shadow-elevated">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 font-black backdrop-blur">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-black">{displayName}</div>
            <div className="truncate text-xs text-white/70">{email}</div>
          </div>
          <Link
            to="/account/profile"
            className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur"
          >
            Edit
          </Link>
        </div>

        {groups.map((g) => (
          <section key={g.title} className="mt-6">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {g.title}
            </h3>
            <div className="overflow-hidden rounded-2xl bg-card">
              {g.items.map((it, i) => {
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to as never}
                    className={
                      "flex items-center gap-3 px-4 py-3.5 active:bg-surface " +
                      (i > 0 ? "border-t border-border" : "")
                    }
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface">
                      <Icon className="h-4 w-4 text-brand" />
                    </div>
                    <span className="flex-1 text-sm font-semibold">{it.label}</span>
                    {it.sub && <span className="text-xs text-muted-foreground">{it.sub}</span>}
                    <ChevronRight
                      className={
                        "h-4 w-4 text-muted-foreground " + (dir === "rtl" ? "rotate-180" : "")
                      }
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() => {
            void auth.logout().then(() => nav({ to: "/auth/login" }));
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 py-4 text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> {t("logout")}
        </button>
        <Link
          to="/account/delete"
          className="mt-2 block text-center text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("auth_deleteAccount")}
        </Link>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          NETRO v1.0 · Made with ⚡
        </p>
      </ScreenBody>
      <BottomNav />
    </MobileScreen>
  );
}
