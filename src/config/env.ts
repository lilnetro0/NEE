/**
 * Centralized public frontend environment configuration.
 *
 * Components and hooks must import from this module — never read
 * `import.meta.env` directly (except inside this file).
 *
 * All VITE_* values are public. Service-role keys, payment secrets, and
 * supplier credentials must never appear here.
 */

export type AppEnvironment = "development" | "preview" | "production";

export type PublicEnv = {
  appEnv: AppEnvironment;
  supabaseUrl: string;
  supabasePublishableKey: string;
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

/**
 * Vite only statically replaces *literal* `import.meta.env.VITE_*` access in
 * production builds. Dynamic `import.meta.env[key]` is always undefined after
 * `vite build`, which breaks Cloudflare / Codemagic even when vars are set.
 */
function readRaw(key: string): string | undefined {
  const env = import.meta.env;
  const table: Record<string, string | boolean | undefined> = {
    VITE_APP_ENV: env.VITE_APP_ENV,
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_ENABLE_DEV_TOOLS: env.VITE_ENABLE_DEV_TOOLS,
    VITE_SENTRY_DSN: env.VITE_SENTRY_DSN,
    VITE_APP_VERSION: env.VITE_APP_VERSION,
    VITE_BUILD_SHA: env.VITE_BUILD_SHA,
  };
  const value = table[key];
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

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

/**
 * Validates and returns the public env. Safe to call at module load.
 * Throws EnvConfigError when Supabase configuration is invalid.
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

  const supabaseUrlRaw = get("VITE_SUPABASE_URL");
  const supabasePublishableKey = get("VITE_SUPABASE_PUBLISHABLE_KEY");
  const enableDevTools = parseBool(get("VITE_ENABLE_DEV_TOOLS"), !isProduction) && !isProduction;
  const sentryDsn = get("VITE_SENTRY_DSN") ?? null;
  const appVersion = get("VITE_APP_VERSION") ?? "0.0.0";
  const buildSha = get("VITE_BUILD_SHA") ?? "unknown";

  if (!supabaseUrlRaw || !supabasePublishableKey) {
    throw new EnvConfigError(
      "Supabase requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  let supabaseUrl: string;
  try {
    const url = new URL(supabaseUrlRaw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    supabaseUrl = normalizeBaseUrl(supabaseUrlRaw);
  } catch {
    throw new EnvConfigError(`VITE_SUPABASE_URL is not a valid URL: "${supabaseUrlRaw}"`);
  }

  if (isProduction && /localhost|127\.0\.0\.1/i.test(supabaseUrl)) {
    throw new EnvConfigError(
      "Production VITE_SUPABASE_URL must not point at localhost. Use your Supabase project URL.",
    );
  }

  return {
    appEnv,
    supabaseUrl,
    supabasePublishableKey,
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
