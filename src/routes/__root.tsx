import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { logger } from "../lib/logger";
import { I18nProvider, useI18n } from "../i18n/I18nProvider";
import { ThemeProvider } from "../theme/ThemeProvider";
import { StoreProvider } from "../store/StoreProvider";
import { RepositoriesProvider } from "../data-access/RepositoriesProvider";
import { PlatformProvider } from "../platform/PlatformProvider";
import { AuthProvider } from "../auth/AuthProvider";
import { AppErrorBoundary } from "../components/common/AppErrorBoundary";
import { EnvGate } from "../config/EnvGate";
import { getPublicEnv } from "../config/env";

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl gradient-brand text-2xl font-black text-brand-foreground">
          N
        </div>
        <h1 className="font-display text-2xl font-bold">{t("error_notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error_notFoundBody")}</p>
        <Link
          to="/home"
          className="mt-6 inline-flex items-center justify-center rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
        >
          {t("returnHome")}
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const { t } = useI18n();
  const referenceId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `err_${Date.now().toString(36)}`;

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    logger.exception(error, { boundary: "route", referenceId });
  }, [error, referenceId]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-xl font-bold">{t("error_genericTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error_genericBody")}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground" dir="ltr">
          {referenceId}
        </p>
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const env = (() => {
      try {
        return getPublicEnv();
      } catch {
        return null;
      }
    })();
    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
        },
        { name: "theme-color", content: "#0d0f1a" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "NETRO" },
        { title: "NETRO — Gift cards, game top-ups & digital codes" },
        {
          name: "description",
          content:
            "Buy PlayStation, Xbox, Steam gift cards and top up PUBG, Free Fire, Mobile Legends and more. Instant delivery in Saudi Arabia and the GCC.",
        },
        { name: "author", content: "NETRO" },
        { property: "og:title", content: "NETRO — Gaming credits & gift cards" },
        {
          property: "og:description",
          content: "Gift cards, game top-ups & digital codes. Instant, secure, mobile-first.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(env
          ? [
              { name: "netro-version", content: env.appVersion },
              { name: "netro-build", content: env.buildSha },
            ]
          : []),
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
        },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <AppErrorBoundary>
      <EnvGate>
        {() => (
          <QueryClientProvider client={queryClient}>
            <PlatformProvider>
              <ThemeProvider>
                <I18nProvider>
                  <StoreProvider>
                    <RepositoriesProvider>
                      <AuthProvider>
                        <Outlet />
                        <Toaster position="top-center" theme="dark" />
                      </AuthProvider>
                    </RepositoriesProvider>
                  </StoreProvider>
                </I18nProvider>
              </ThemeProvider>
            </PlatformProvider>
          </QueryClientProvider>
        )}
      </EnvGate>
    </AppErrorBoundary>
  );
}
