/**
 * Centralized public frontend environment configuration.
 *
 * Components and hooks must import from this module — never read
 * `import.meta.env` directly (except inside this file).
 *
 * All VITE_* values are public. Supplier / payment / DB secrets must never
 * appear here.
 */

export type AppEnvironment = "development" | "preview" | "production";

export type PublicEnv = {
  appEnv: AppEnvironment;
  apiBaseUrl: string | null;
  useMocks: boolean;
  enableDevTools: boolean;
  sentryDsn: string | null;
  appVersion: string;
  buildSha: string;
  /** True when Vite built with production mode. */
  isViteProduction: boolean;
};

export class EnvConfigError extends Error {
  readonly code = "ENV_CONFIG_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "EnvConfigError";
  }
}

function readRaw(key: string): string | undefined {
  const value = (import.meta.env as Record<string, string | boolean | undefined>)[key];
  if (value === undefined || value === null) return undefined;
  const asString = String(value).trim();
  return asString.length === 0 ? undefined : asString;
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const normalized = raw.toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  throw new EnvConfigError(`Invalid boolean for environment flag: "${raw}"`);
}

function parseAppEnv(raw: string | undefined, isViteProduction: boolean): AppEnvironment {
  if (raw === "development" || raw === "preview" || raw === "production") return raw;
  if (raw === undefined) return isViteProduction ? "production" : "development";
  throw new EnvConfigError(
    `Invalid VITE_APP_ENV="${raw}". Expected development | preview | production.`,
  );
}

function normalizeBaseUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/**
 * Validates and returns the public env. Safe to call at module load.
 * Throws EnvConfigError when production/HTTP configuration is invalid.
 */
export function loadPublicEnv(
  source: {
    viteProd?: boolean;
    get?: (key: string) => string | undefined;
  } = {},
): PublicEnv {
  const get = source.get ?? readRaw;
  const isViteProduction = source.viteProd ?? Boolean(import.meta.env.PROD);
  const appEnv = parseAppEnv(get("VITE_APP_ENV"), isViteProduction);
  const isProduction = appEnv === "production" || isViteProduction;

  // Production defaults to HTTP (mocks off). Dev/preview default to mocks.
  const useMocks = parseBool(get("VITE_USE_MOCKS"), !isProduction);
  const apiBaseUrl = normalizeBaseUrl(get("VITE_API_BASE_URL"));
  const enableDevTools = parseBool(get("VITE_ENABLE_DEV_TOOLS"), !isProduction) && !isProduction;
  const sentryDsn = get("VITE_SENTRY_DSN") ?? null;
  const appVersion = get("VITE_APP_VERSION") ?? "0.0.0";
  const buildSha = get("VITE_BUILD_SHA") ?? "unknown";

  if (isProduction && useMocks) {
    throw new EnvConfigError(
      "Production builds cannot use mock repositories. Set VITE_USE_MOCKS=false and provide VITE_API_BASE_URL.",
    );
  }

  if (!useMocks && !apiBaseUrl) {
    throw new EnvConfigError(
      "HTTP repository mode requires VITE_API_BASE_URL (NETRO backend only — never a distributor URL).",
    );
  }

  if (apiBaseUrl) {
    try {
      const url = new URL(apiBaseUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("bad protocol");
      }
    } catch {
      throw new EnvConfigError(`VITE_API_BASE_URL is not a valid URL: "${apiBaseUrl}"`);
    }
  }

  if (isProduction && apiBaseUrl && /localhost|127\.0\.0\.1/i.test(apiBaseUrl)) {
    throw new EnvConfigError(
      "Production VITE_API_BASE_URL must not point at localhost. Use the NETRO backend URL.",
    );
  }

  return {
    appEnv,
    apiBaseUrl,
    useMocks,
    enableDevTools,
    sentryDsn,
    appVersion,
    buildSha,
    isViteProduction,
  };
}

let cached: PublicEnv | null = null;

/** Lazy singleton — validated once per runtime. */
export function getPublicEnv(): PublicEnv {
  if (!cached) cached = loadPublicEnv();
  return cached;
}

/** Test helper to reset / inject env. */
export function __resetPublicEnvForTests(next?: PublicEnv | null): void {
  cached = next ?? null;
}

export function isDevToolsEnabled(): boolean {
  return getPublicEnv().enableDevTools;
}

export function isMockRepositoriesEnabled(): boolean {
  return getPublicEnv().useMocks;
}
