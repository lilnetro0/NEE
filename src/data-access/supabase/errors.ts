import type { AppErrorCode } from "../result";
import { err, type Result } from "../result";

export function mapSupabaseError(error: { message: string; code?: string } | null): Result<never> {
  if (!error) return err("unknown", "UNKNOWN");
  const message = error.message.toUpperCase().replace(/\s+/g, "_");
  let code: AppErrorCode = "unknown";
  const lower = error.message.toLowerCase();
  if (lower.includes("jwt") || lower.includes("session") || lower.includes("auth")) {
    code = "unauthorized";
  } else if (lower.includes("rate") || error.code === "over_request_rate_limit") {
    code = "rate_limited";
  } else if (lower.includes("network") || lower.includes("fetch")) {
    code = "network";
  } else if (lower.includes("not found") || error.code === "PGRST116") {
    code = "not_found";
  } else if (lower.includes("invalid") || lower.includes("otp") || lower.includes("credential")) {
    code = "validation";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return err("unauthorized", "INVALID_CREDENTIALS", error);
  }
  if (lower.includes("expired")) {
    return err("validation", "OTP_EXPIRED", error);
  }
  if (lower.includes("otp") || lower.includes("token")) {
    return err("validation", "INVALID_OTP", error);
  }
  return err(code, message || "UNKNOWN", error);
}

export function maskDestination(destination: string): string {
  const trimmed = destination.trim();
  if (trimmed.includes("@")) {
    const [user, domain] = trimmed.split("@");
    if (!domain) return "***";
    const visible = user.slice(0, Math.min(2, user.length));
    return `${visible}***@${domain}`;
  }
  if (trimmed.length <= 4) return "****";
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-2)}`;
}

export function encodeChallengeId(payload: Record<string, string>): string {
  return btoa(JSON.stringify(payload));
}

export function decodeChallengeId(id: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(atob(id)) as Record<string, string>;
    return parsed;
  } catch {
    return null;
  }
}
