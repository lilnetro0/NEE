import { cancelledError, type Result } from "../result";
import type { RequestOptions } from "../options";

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new DOMException("Aborted", "AbortError");
    throw error;
  }
}

export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    throwIfAborted(signal);
    await Promise.resolve();
    throwIfAborted(signal);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "AbortError")
  );
}

export async function withMockLatency<T>(
  ms: number,
  run: () => Result<T> | Promise<Result<T>>,
  options?: RequestOptions,
): Promise<Result<T>> {
  try {
    await delay(ms, options?.signal);
    const result = await run();
    throwIfAborted(options?.signal);
    return result;
  } catch (error) {
    if (isAbortError(error)) return cancelledError(error);
    throw error;
  }
}
