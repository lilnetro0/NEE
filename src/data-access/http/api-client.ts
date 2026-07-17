/**
 * Typed NETRO backend API client.
 * All browser HTTP traffic must go through this client to the NETRO API only.
 * Never point this at distributor / payment-provider origins.
 */

import { getPublicEnv } from "@/config/env";
import { logger } from "@/lib/logger";
import { err, ok, type AppError, type AppErrorCode, type Result } from "@/data-access/result";

export type ApiClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  getAccessToken?: () => Promise<string | null>;
  onUnauthorized?: () => void;
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Retry safe GET requests only. Default: true for GET, false otherwise. */
  retry?: boolean;
  idempotencyKey?: string;
};

const DEFAULT_TIMEOUT_MS = 20_000;

function createCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function mapStatusToCode(status: number): AppErrorCode {
  if (status === 401) return "unauthorized";
  if (status === 403) return "unauthorized";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "unavailable";
  return "unknown";
}

function normalizeApiError(status: number, body: unknown, correlationId: string): AppError {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const serverCode = typeof record.code === "string" ? record.code : undefined;
  const serverMessage =
    typeof record.message === "string" ? record.message : `Request failed (${status})`;

  return {
    code: mapStatusToCode(status),
    message: serverCode ?? serverMessage,
    cause: { status, correlationId },
  };
}

async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: "Invalid JSON response" };
  }
}

export class NetroApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly getAccessToken?: () => Promise<string | null>;
  private readonly onUnauthorized?: () => void;

  constructor(options: ApiClientOptions = {}) {
    const env = getPublicEnv();
    const base = options.baseUrl ?? env.apiBaseUrl;
    if (!base) {
      throw new Error("NetroApiClient requires VITE_API_BASE_URL when mocks are disabled.");
    }
    this.baseUrl = base.replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.getAccessToken = options.getAccessToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<Result<T>> {
    const method = options.method ?? "GET";
    const canRetry = options.retry ?? method === "GET";
    const maxAttempts = canRetry ? 2 : 1;
    let lastError: AppError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const result = await this.singleAttempt<T>(path, options);
      if (result.ok) return result;
      lastError = result.error;
      const retryableNetwork =
        result.error.code === "network" || result.error.code === "unavailable";
      if (!canRetry || !retryableNetwork || attempt === maxAttempts) {
        return result;
      }
    }

    return err(lastError?.code ?? "unknown", lastError?.message ?? "Request failed");
  }

  private async singleAttempt<T>(path: string, options: ApiRequestOptions): Promise<Result<T>> {
    const method = options.method ?? "GET";
    const correlationId = createCorrelationId();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const onOuterAbort = () => controller.abort();
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener("abort", onOuterAbort, { once: true });
    }

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Request-Id": correlationId,
        "X-Correlation-Id": correlationId,
        ...options.headers,
      };

      if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      if (options.idempotencyKey) {
        headers["Idempotency-Key"] = options.idempotencyKey;
      }

      // Cookie-based auth is preferred for PWA. Bearer is optional for Capacitor bridges.
      const token = this.getAccessToken ? await this.getAccessToken() : null;
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
        credentials: "include",
      });

      const body = await readJsonSafe(response);

      if (response.status === 401) {
        this.onUnauthorized?.();
        return err("unauthorized", "UNAUTHORIZED", { status: 401, correlationId });
      }
      if (response.status === 403) {
        return err("unauthorized", "FORBIDDEN", { status: 403, correlationId });
      }
      if (!response.ok) {
        const apiError = normalizeApiError(response.status, body, correlationId);
        logger.warn("NETRO API error", {
          status: response.status,
          correlationId,
          errorCode: apiError.code,
          path,
        });
        return { ok: false, error: apiError };
      }

      return ok(body as T);
    } catch (cause) {
      if (controller.signal.aborted && options.signal?.aborted) {
        return err("cancelled", "Request was cancelled", cause);
      }
      const offline =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "NETWORK_ERROR"
          : "NETWORK_ERROR";
      logger.warn("NETRO API network failure", { path, correlationId });
      return err("network", offline, cause);
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", onOuterAbort);
    }
  }

  get<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    // POST is never auto-retried (checkout / payment / order-create safety).
    return this.request<T>(path, { ...options, method: "POST", body, retry: false });
  }

  put<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PUT", body, retry: false });
  }

  patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "PATCH", body, retry: false });
  }

  delete<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "DELETE", retry: false });
  }
}

let singleton: NetroApiClient | null = null;

export function getApiClient(options?: ApiClientOptions): NetroApiClient {
  if (options) return new NetroApiClient(options);
  if (!singleton) singleton = new NetroApiClient();
  return singleton;
}

export function __resetApiClientForTests(): void {
  singleton = null;
}
