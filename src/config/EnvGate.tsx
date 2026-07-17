import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { EnvConfigError, getPublicEnv, type PublicEnv } from "@/config/env";
import { initObservability } from "@/lib/logger";

type Props = {
  children: (env: PublicEnv) => ReactNode;
};

const shellStyle: CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  boxSizing: "border-box",
  background: "#0d0f1a",
  color: "#f4f6fb",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  textAlign: "center",
};

/**
 * Validates public env once at startup and initializes observability.
 * Renders a clear failure screen when Supabase configuration is invalid.
 * Uses inline styles so Capacitor still shows an error if CSS fails to load.
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
      <div style={shellStyle}>
        <div>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 28,
              color: "#fff",
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            }}
          >
            N
          </div>
          <p style={{ margin: 0, color: "#a8b0c2", fontSize: 14 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={shellStyle} role="alert">
        <div style={{ maxWidth: "22rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 28,
              color: "#fff",
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            }}
          >
            N
          </div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Configuration error</h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.45, color: "#a8b0c2" }}>
            {state.message}
          </p>
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#7b8499" }}>
            Rebuild the native app with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY set at
            build time (Vite inlines them). Note: the publishable key is the anon key — there is no
            VITE_SUPABASE_ANON_KEY in this project.
          </p>
        </div>
      </div>
    );
  }

  return <>{children(state.env)}</>;
}
