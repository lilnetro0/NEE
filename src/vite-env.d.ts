/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_ENABLE_DEV_TOOLS?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
