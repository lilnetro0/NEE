import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";

type Props = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void, referenceId: string) => ReactNode;
};

type State = {
  error: Error | null;
  referenceId: string | null;
};

/**
 * Top-level React error boundary. Never renders stack traces to users.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, referenceId: null };

  static getDerivedStateFromError(error: Error): State {
    const referenceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `err_${Date.now().toString(36)}`;
    return { error, referenceId };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.exception(error, {
      boundary: "AppErrorBoundary",
      referenceId: this.state.referenceId,
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  reset = () => {
    this.setState({ error: null, referenceId: null });
  };

  render() {
    const { error, referenceId } = this.state;
    if (!error || !referenceId) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset, referenceId);
    }

    return (
      <div
        style={{
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
        }}
        role="alert"
      >
        <div style={{ maxWidth: "22rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "#a8b0c2", lineHeight: 1.45 }}>
            Try again in a moment. If the problem continues, contact support with this reference:
          </p>
          <p style={{ margin: "12px 0 0", fontFamily: "ui-monospace, monospace", fontSize: 12 }} dir="ltr">
            {referenceId}
          </p>
          <button
            type="button"
            onClick={this.reset}
            style={{
              marginTop: 20,
              border: 0,
              borderRadius: 999,
              padding: "12px 20px",
              fontWeight: 700,
              background: "#3b82f6",
              color: "#fff",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
