import type {
  AuthSessionTokens,
  AuthSignInResult,
  DeviceSession,
  OtpChallenge,
  OtpPurpose,
  ReauthToken,
} from "@/domain/auth";
import type { User } from "@/domain/user";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type RequestOtpInput = {
  phone: string;
  purpose: Extract<OtpPurpose, "login" | "signup">;
};

export type VerifyOtpInput = {
  challengeId: string;
  code: string;
};

export type PasswordLoginInput = {
  /** Email address. */
  identifier: string;
  password: string;
};

export type SignupInput = {
  displayName: string;
  email: string;
  password: string;
  /** Optional; phone OTP auth is deferred until SMS is configured. */
  phone?: string;
};

export type AuthRepository = {
  /** Phone OTP (deferred — kept for account phone change / future SMS). */
  requestPhoneOtp(input: RequestOtpInput, options?: RequestOptions): Promise<Result<OtpChallenge>>;

  /** Complete phone OTP and establish a session. */
  verifyPhoneOtp(
    input: VerifyOtpInput,
    options?: RequestOptions,
  ): Promise<Result<AuthSignInResult>>;

  /** Resend OTP for an existing challenge. */
  resendPhoneOtp(challengeId: string, options?: RequestOptions): Promise<Result<OtpChallenge>>;

  /** Email + password authentication (primary sign-in). */
  loginWithPassword(
    input: PasswordLoginInput,
    options?: RequestOptions,
  ): Promise<Result<AuthSignInResult>>;

  /** Create account with email + password and establish a session. */
  signup(input: SignupInput, options?: RequestOptions): Promise<Result<AuthSignInResult>>;

  requestPasswordReset(email: string, options?: RequestOptions): Promise<Result<OtpChallenge>>;

  resetPassword(
    input: { challengeId: string; code: string; newPassword: string },
    options?: RequestOptions,
  ): Promise<Result<void>>;

  /** Restore session from secure-storage tokens (called by AuthProvider). */
  restoreSession(
    tokens: AuthSessionTokens,
    options?: RequestOptions,
  ): Promise<Result<{ user: User; session: AuthSessionTokens }>>;

  refreshSession(
    refreshToken: string,
    options?: RequestOptions,
  ): Promise<Result<AuthSessionTokens>>;

  logout(options?: RequestOptions): Promise<Result<void>>;

  reauth(password: string, options?: RequestOptions): Promise<Result<ReauthToken>>;

  listSessions(options?: RequestOptions): Promise<Result<DeviceSession[]>>;

  revokeSession(sessionId: string, options?: RequestOptions): Promise<Result<void>>;

  deleteAccount(password: string, options?: RequestOptions): Promise<Result<void>>;

  requestEmailChange(email: string, options?: RequestOptions): Promise<Result<OtpChallenge>>;

  verifyEmailChange(
    input: { challengeId: string; code: string },
    options?: RequestOptions,
  ): Promise<Result<void>>;

  requestPhoneChange(phone: string, options?: RequestOptions): Promise<Result<OtpChallenge>>;

  verifyPhoneChange(
    input: { challengeId: string; code: string },
    options?: RequestOptions,
  ): Promise<Result<void>>;
};
