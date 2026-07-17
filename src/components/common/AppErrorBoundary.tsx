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
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Try again in a moment. If the problem continues, contact support with this reference:
          </p>
          <p className="mt-2 font-mono text-xs" dir="ltr">
            {referenceId}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-6 rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
