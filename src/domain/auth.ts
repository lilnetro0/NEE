/**
 * Authentication domain types.
 * UI state lives in AuthProvider; tokens never touch preference/localStorage.
 */

import type { IsoDateTime } from "./common";
import type { User } from "./user";

/** Purpose of an OTP challenge issued by the backend (mock today). */
export type OtpPurpose = "login" | "signup" | "phone_change" | "email_change" | "password_reset";

export type OtpChallenge = {
  id: string;
  purpose: OtpPurpose;
  /** Masked destination shown in UI (e.g. +966••••1234). */
  destinationMasked: string;
  /** Full destination kept only in memory for the challenge — not persisted. */
  destination: string;
  expiresAt: IsoDateTime;
  resendAvailableAt: IsoDateTime;
};

/** Backend session payload. Persisted only via platform secureStorage. */
export type AuthSessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: IsoDateTime;
  userId: string;
};

export type DeviceSession = {
  id: string;
  device: string;
  location: string;
  lastActive: IsoDateTime;
  current: boolean;
};

export type ReauthToken = {
  token: string;
  expiresAt: IsoDateTime;
};

export type AuthSignInResult = {
  user: User;
  session: AuthSessionTokens;
};

/**
 * UI-facing auth phase — independent of the AuthRepository implementation.
 * Screens bind to this; the repository returns Result / domain types only.
 */
export type AuthUiPhase =
  | "booting"
  | "anonymous"
  | "loading"
  | "awaiting_otp"
  | "invalid_otp"
  | "expired_otp"
  | "rate_limited"
  | "network_error"
  | "authenticated"
  | "session_expired"
  | "locked";

/** Stable message codes returned by the mock / future API. */
export type AuthErrorMessage =
  | "INVALID_OTP"
  | "OTP_EXPIRED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "INVALID_CODE"
  | "VALIDATION";

export const AUTH_SECURE_SESSION_KEY = "auth.session";
export const AUTH_SECURE_REAUTH_KEY = "reauth";
export const AUTH_LOCAL_UNLOCK_PREF_KEY = "auth.localUnlockEnabled";
