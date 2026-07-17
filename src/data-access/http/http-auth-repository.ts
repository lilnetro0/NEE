import type {
  AuthSessionTokens,
  AuthSignInResult,
  DeviceSession,
  OtpChallenge,
  ReauthToken,
} from "@/domain/auth";
import type { User } from "@/domain/user";
import type {
  AuthRepository,
  PasswordLoginInput,
  RequestOtpInput,
  SignupInput,
  VerifyOtpInput,
} from "../repositories/auth-repository";
import type { NetroApiClient } from "./api-client";

/**
 * HTTP auth against NETRO backend.
 * Prefer HttpOnly secure cookies (`credentials: "include"` on the client).
 * Bearer tokens are only for future Capacitor bridges via secure storage —
 * never localStorage.
 */
export function createHttpAuthRepository(client: NetroApiClient): AuthRepository {
  return {
    requestPhoneOtp(input: RequestOtpInput, options) {
      return client.post<OtpChallenge>("/v1/auth/otp/request", input, {
        signal: options?.signal,
      });
    },
    verifyPhoneOtp(input: VerifyOtpInput, options) {
      return client.post<AuthSignInResult>("/v1/auth/otp/verify", input, {
        signal: options?.signal,
      });
    },
    resendPhoneOtp(challengeId, options) {
      return client.post<OtpChallenge>(
        "/v1/auth/otp/resend",
        { challengeId },
        { signal: options?.signal },
      );
    },
    loginWithPassword(input: PasswordLoginInput, options) {
      return client.post<AuthSignInResult>("/v1/auth/login", input, {
        signal: options?.signal,
      });
    },
    signup(input: SignupInput, options) {
      return client.post<OtpChallenge>("/v1/auth/signup", input, {
        signal: options?.signal,
      });
    },
    requestPasswordReset(email, options) {
      return client.post<OtpChallenge>(
        "/v1/auth/password/forgot",
        { email },
        { signal: options?.signal },
      );
    },
    resetPassword(input, options) {
      return client.post<void>("/v1/auth/password/reset", input, {
        signal: options?.signal,
      });
    },
    restoreSession(tokens: AuthSessionTokens, options) {
      return client.post<{ user: User; session: AuthSessionTokens }>(
        "/v1/auth/session/restore",
        { refreshToken: tokens.refreshToken },
        { signal: options?.signal },
      );
    },
    refreshSession(refreshToken, options) {
      return client.post<AuthSessionTokens>(
        "/v1/auth/session/refresh",
        { refreshToken },
        { signal: options?.signal },
      );
    },
    logout(options) {
      return client.post<void>("/v1/auth/logout", {}, { signal: options?.signal });
    },
    reauth(password, options) {
      return client.post<ReauthToken>("/v1/auth/reauth", { password }, { signal: options?.signal });
    },
    listSessions(options) {
      return client.get<DeviceSession[]>("/v1/auth/sessions", {
        signal: options?.signal,
      });
    },
    revokeSession(sessionId, options) {
      return client.delete<void>(`/v1/auth/sessions/${encodeURIComponent(sessionId)}`, {
        signal: options?.signal,
      });
    },
    deleteAccount(password, options) {
      return client.post<void>(
        "/v1/auth/account/delete",
        { password },
        { signal: options?.signal },
      );
    },
    requestEmailChange(email, options) {
      return client.post<OtpChallenge>(
        "/v1/auth/email/change",
        { email },
        { signal: options?.signal },
      );
    },
    verifyEmailChange(input, options) {
      return client.post<void>("/v1/auth/email/verify", input, {
        signal: options?.signal,
      });
    },
    requestPhoneChange(phone, options) {
      return client.post<OtpChallenge>(
        "/v1/auth/phone/change",
        { phone },
        { signal: options?.signal },
      );
    },
    verifyPhoneChange(input, options) {
      return client.post<void>("/v1/auth/phone/verify", input, {
        signal: options?.signal,
      });
    },
  };
}
