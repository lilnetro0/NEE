export type AppErrorCode =
  | "not_found"
  | "cancelled"
  | "validation"
  | "unauthorized"
  | "conflict"
  | "unavailable"
  | "rate_limited"
  | "network"
  | "unknown";

export type AppError = {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(code: AppErrorCode, message: string, cause?: unknown): Result<never> {
  return { ok: false, error: { code, message, cause } };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    typeof (value as AppError).code === "string" &&
    typeof (value as AppError).message === "string"
  );
}

export function cancelledError(cause?: unknown): Result<never> {
  return err("cancelled", "Request was cancelled", cause);
}

export function notFoundError(entity: string, id?: string): Result<never> {
  return err("not_found", id ? `${entity} '${id}' was not found` : `${entity} was not found`);
}
