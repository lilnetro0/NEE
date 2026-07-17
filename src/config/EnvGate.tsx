import { useEffect, useState, type ReactNode } from "react";
import { EnvConfigError, getPublicEnv, type PublicEnv } from "@/config/env";
import { initObservability } from "@/lib/logger";

type Props = {
  children: (env: PublicEnv) => ReactNode;
};

/**
 * Validates public env once at startup and initializes observability.
 * Renders a clear failure screen when Supabase configuration is invalid.
 */
export function EnvGate({ children }: Props) {
  const [state, setState] = useState<
    { status: "ok"; env: PublicEnv } | { status: "error"; message: string } | { status: "loading" }
  >({ status: "loading" });

  useEffect(() => {
    try {
      const env = getPublicEnv();
      void initObservability();
      setState({ status: "ok", env });
    } catch (error) {
      const message =
        error instanceof EnvConfigError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Invalid environment configuration";
      setState({ status: "error", message });
    }
  }, []);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-xl font-bold">Configuration error</h1>
          <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Check `.env` against `.env.example`. Set `VITE_SUPABASE_URL` and
            `VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project API settings.
          </p>
        </div>
      </div>
    );
  }

  return <>{children(state.env)}</>;
}
