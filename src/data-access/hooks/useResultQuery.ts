import { useCallback } from "react";
import { keepPreviousData, useQuery, type QueryKey } from "@tanstack/react-query";
import type { AppError, Result } from "../result";

export type QueryStatus = "loading" | "ready" | "error" | "empty";

export type QueryResult<T> = {
  status: QueryStatus;
  data: T | undefined;
  error: AppError | null;
  /** True while a background refresh is running with cached data on screen. */
  refreshing: boolean;
  reload: () => void;
};

/** Carries the repository AppError through React Query's error channel. */
class ResultQueryError extends Error {
  readonly appError: AppError;

  constructor(appError: AppError) {
    super(appError.message);
    this.name = "ResultQueryError";
    this.appError = appError;
  }
}

function toAppError(error: unknown): AppError {
  if (error instanceof ResultQueryError) return error.appError;
  return {
    code: "unknown",
    message: error instanceof Error ? error.message : "Request failed",
    cause: error,
  };
}

function isEmptyData(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  return Array.isArray(data) && data.length === 0;
}

/**
 * Repository query backed by the React Query cache.
 *
 * Screens must not call fetch; they call repository methods through this hook.
 * Cached data renders instantly on revisit while a background refetch keeps it
 * fresh — a screen only reports "loading" when it has nothing to show yet.
 */
export function useResultQuery<T>(
  queryKey: QueryKey,
  fetcher: (signal: AbortSignal) => Promise<Result<T>>,
): QueryResult<T> {
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const result = await fetcher(signal);
      if (!result.ok) throw new ResultQueryError(result.error);
      // React Query treats `undefined` as "no data"; normalize to null.
      return (result.data ?? null) as T | null;
    },
    placeholderData: keepPreviousData,
  });

  const { refetch } = query;
  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  const data = (query.data ?? undefined) as T | undefined;

  let status: QueryStatus;
  if (query.data !== undefined && !query.isError) {
    status = isEmptyData(query.data) ? "empty" : "ready";
  } else if (query.isError) {
    const appError = toAppError(query.error);
    status = appError.code === "cancelled" ? "loading" : "error";
  } else {
    status = "loading";
  }

  return {
    status,
    data,
    error: query.isError ? toAppError(query.error) : null,
    refreshing: query.isFetching && query.data !== undefined,
    reload,
  };
}
