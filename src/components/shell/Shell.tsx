import { Link, useRouterState } from "@tanstack/react-router";
import { useAppBack } from "@/lib/useAppBack";
import {
  Home,
  LayoutGrid,
  Search,
  Package,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ============ Top App Bar ============
export function TopBar({
  title,
  showBack,
  showCart = true,
  showNotif = true,
  showFav,
  right,
  transparent,
}: {
  title?: ReactNode;
  showBack?: boolean;
  showCart?: boolean;
  showNotif?: boolean;
  showFav?: boolean;
  right?: ReactNode;
  transparent?: boolean;
}) {
  const goBack = useAppBack();
  const { count } = useStore();
  const { dir, t } = useI18n();
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  return (
    <header
      className={cn(
        "pt-safe sticky top-0 z-40 flex items-center gap-2 px-4 pb-2",
        transparent ? "bg-transparent" : "glass border-b",
      )}
    >
      {showBack && (
        <button
          onClick={goBack}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface active:scale-95"
          aria-label={t("back")}
        >
          <BackIcon className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {typeof title === "string" ? (
          <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
        ) : (
          title
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {right}
        {showFav && (
          <Link
            to="/favorites"
            aria-label={t("favorites")}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface active:scale-95"
          >
            <Heart className="h-5 w-5" />
          </Link>
        )}
        {showNotif && (
          <Link
            to="/notifications"
            aria-label={t("notifications")}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-surface active:scale-95"
          >
            <Bell className="h-5 w-5" />
          </Link>
        )}
        {showCart && (
          <Link
            to="/cart"
            aria-label={t("cart")}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-surface active:scale-95"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                {count}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}

// ============ Bottom Nav ============
const navItems: { to: string; key: string; icon: typeof Home; center?: boolean }[] = [
  { to: "/home", key: "nav_home", icon: Home },
  { to: "/categories", key: "nav_categories", icon: LayoutGrid },
  { to: "/search", key: "nav_search", icon: Search, center: true },
  { to: "/orders", key: "nav_orders", icon: Package },
  { to: "/account", key: "nav_account", icon: User },
];

export function BottomNav() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t glass">
      <ul className="mx-auto flex max-w-md items-end justify-between px-3 pt-2">
        {navItems.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          if (item.center) {
            return (
              <li key={item.to} className="-mt-6">
                <Link
                  to={item.to as never}
                  className="grid h-14 w-14 place-items-center rounded-full gradient-brand text-brand-foreground shadow-elevated active:scale-95"
                >
                  <Icon className="h-6 w-6" strokeWidth={2.4} />
                </Link>
              </li>
            );
          }
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to as never}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t(item.key as never)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ============ Layout wrappers ============
export function MobileScreen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-h-[100dvh] bg-background", className)}>{children}</div>;
}

export function ScreenBody({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("px-4 pb-safe-nav", className)}>{children}</main>;
}
