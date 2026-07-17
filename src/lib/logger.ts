/**
 * Application logger — development console, sanitized production behavior.
 * Never log tokens, OTPs, codes, PII, payment details, or supplier data.
 */

import { getPublicEnv } from "@/config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const SENSITIVE_KEY =
  /(token|password|secret|authorization|otp|code|email|phone|player|server.?id|pan|cvv|card|supplier|cost|balance|refresh|access)/i;

/** Operational metadata that may contain the substring "code" but is safe to log. */
const LOG_KEY_ALLOWLIST = new Set([
  "errorcode",
  "statuscode",
  "correlationid",
  "referenceid",
  "path",
  "status",
  "message",
  "appenv",
  "appversion",
  "buildsha",
  "boundary",
  "componentstack",
]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (LOG_KEY_ALLOWLIST.has(lower)) return false;
  return SENSITIVE_KEY.test(key);
}

function scrubValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) return "[redacted]";
  if (typeof value === "string" && value.length > 240) return `${value.slice(0, 240)}…`;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return scrubContext(value as LogContext);
  }
  return value;
}

export function scrubContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    out[key] = scrubValue(key, value);
  }
  return out;
}

type SentryLike = {
  captureException: (error: unknown, hint?: { extra?: LogContext }) => void;
  captureMessage: (message: string, level?: string) => void;
};

let sentry: SentryLike | null = null;

/** Optional Sentry bridge — only called when VITE_SENTRY_DSN is configured. */
export function registerSentryBridge(bridge: SentryLike | null): void {
  sentry = bridge;
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  let env: ReturnType<typeof getPublicEnv> | null = null;
  try {
    env = getPublicEnv();
  } catch {
    // Avoid recursive boot failures when env is missing (Capacitor misconfig).
  }
  const safe = scrubContext(context);
  const payload = {
    message,
    ...safe,
    appVersion: env?.appVersion ?? "unknown",
    buildSha: env?.buildSha ?? "unknown",
    appEnv: env?.appEnv ?? "unknown",
  };

  if (!env?.isViteProduction && env?.appEnv === "development") {
    const fn =
      level === "debug"
        ? console.debug
        : level === "info"
          ? console.info
          : level === "warn"
            ? console.warn
            : console.error;
    fn(`[NETRO:${level}]`, message, safe ?? "");
    return;
  }

  // Always surface errors on native / when Sentry is unavailable.
  if (level === "error") {
    console.error(`[NETRO:error]`, message, safe ?? "");
  }

  if (level === "error" && sentry) {
    sentry.captureMessage(message, "error");
    if (safe) sentry.captureException(new Error(message), { extra: payload });
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
  exception: (error: unknown, context?: LogContext) => {
    const safe = scrubContext(context);
    const message = error instanceof Error ? error.message : "Unknown error";
    emit("error", message, safe);
    try {
      if (getPublicEnv().sentryDsn && sentry) {
        sentry.captureException(error, { extra: safe });
      }
    } catch {
      // Env may be unavailable during early boot.
    }
  },
};

/**
 * Initialize optional Sentry when DSN is present.
 * Uses dynamic import so the SDK is not required until configured.
 */
export async function initObservability(): Promise<void> {
  const env = getPublicEnv();
  if (!env.sentryDsn) {
    registerSentryBridge(null);
    return;
  }
  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn: env.sentryDsn,
      environment: env.appEnv,
      release: `${env.appVersion}+${env.buildSha}`,
      tracesSampleRate: env.appEnv === "production" ? 0.1 : 0,
    });
    registerSentryBridge({
      captureException: (error, hint) => {
        Sentry.captureException(error, { extra: hint?.extra });
      },
      captureMessage: (message, level) => {
        Sentry.captureMessage(message, level as "error" | "warning" | "info" | undefined);
      },
    });
    logger.info("Sentry initialized", { release: `${env.appVersion}+${env.buildSha}` });
  } catch (error) {
    registerSentryBridge(null);
    logger.warn("Sentry failed to initialize", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
