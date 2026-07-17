/**
 * Auth session storage policy for production PWA + future Capacitor.
 *
 * - Prefer HttpOnly Secure SameSite cookies from the NETRO backend for the PWA.
 * - Capacitor may keep refresh/access material in platform secure storage.
 * - Never use localStorage for tokens, OTPs, or gift-card codes.
 * - Do not log tokens, OTP values, phones, emails, or codes.
 */

import type { SecureStorage } from "@/platform/contracts";
import { AUTH_SECURE_SESSION_KEY, type AuthSessionTokens } from "@/domain/auth";

export type SessionStorageMode = "cookie" | "secure_storage";

export type AuthSessionPolicy = {
  /** PWA production default. */
  mode: SessionStorageMode;
  /** When cookie mode, JS may still hold a non-sensitive session marker. */
  allowJsSessionMarker: boolean;
};

export function resolveAuthSessionPolicy(isNativeShell: boolean): AuthSessionPolicy {
  if (isNativeShell) {
    return { mode: "secure_storage", allowJsSessionMarker: false };
  }
  return { mode: "cookie", allowJsSessionMarker: true };
}

export async function readStoredSessionTokens(
  secureStorage: SecureStorage,
): Promise<AuthSessionTokens | null> {
  const raw = await secureStorage.get(AUTH_SECURE_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSessionTokens;
  } catch {
    await secureStorage.remove(AUTH_SECURE_SESSION_KEY);
    return null;
  }
}

export async function writeStoredSessionTokens(
  secureStorage: SecureStorage,
  session: AuthSessionTokens,
): Promise<void> {
  await secureStorage.set(AUTH_SECURE_SESSION_KEY, JSON.stringify(session));
}

export async function clearStoredSessionTokens(secureStorage: SecureStorage): Promise<void> {
  await secureStorage.remove(AUTH_SECURE_SESSION_KEY);
}
