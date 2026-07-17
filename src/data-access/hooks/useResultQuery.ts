import { useCallback, useEffect, useRef, useState } from "react";
import type { AppError, Result } from "../result";

export type QueryStatus = "loading" | "ready" | "error" | "empty";

export type QueryResult<T> = {
  status: QueryStatus;
  data: T | undefined;
  error: AppError | null;
  reload: () => void;
};

function toStatus<T>(result: Result<T>): { status: QueryStatus; data?: T; error: AppError | null } {
  if (!result.ok) {
    if (result.error.code === "cancelled") {
      return { status: "loading", error: null };
    }
    return { status: "error", error: result.error };
  }
  const data = result.data;
  if (data === null || data === undefined) {
    return { status: "empty", data, error: null };
  }
  if (Array.isArray(data) && data.length === 0) {
    return { status: "empty", data, error: null };
  }
  return { status: "ready", data, error: null };
}

/**
 * Runs a repository call with AbortController cancellation on dependency change/unmount.
 * Screens must not call fetch; they call repository methods through this hook.
 */
export function useResultQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<Result<T>>,
  deps: readonly unknown[],
): QueryResult<T> {
  const [status, setStatus] = useState<QueryStatus>("loading");
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<AppError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setStatus("loading");
    setError(null);

    void (async () => {
      const result = await fetcherRef.current(controller.signal);
      if (!active || controller.signal.aborted) return;
      const next = toStatus(result);
      setStatus(next.status);
      setData(next.data);
      setError(next.error);
    })();

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps provided by caller
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { status, data, error, reload };
}
