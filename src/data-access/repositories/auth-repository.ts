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
  /** Email (secondary identity) or phone. */
  identifier: string;
  password: string;
};

export type SignupInput = {
  displayName: string;
  phone: string;
  email?: string;
  /** Optional password — phone OTP remains the primary verifier. */
  password?: string;
};

export type AuthRepository = {
  /** Start phone OTP as the primary authentication path. */
  requestPhoneOtp(input: RequestOtpInput, options?: RequestOptions): Promise<Result<OtpChallenge>>;

  /** Complete phone OTP and establish a session. */
  verifyPhoneOtp(
    input: VerifyOtpInput,
    options?: RequestOptions,
  ): Promise<Result<AuthSignInResult>>;

  /** Resend OTP for an existing challenge. */
  resendPhoneOtp(challengeId: string, options?: RequestOptions): Promise<Result<OtpChallenge>>;

  /** Optional password authentication (email or phone identifier). */
  loginWithPassword(
    input: PasswordLoginInput,
    options?: RequestOptions,
  ): Promise<Result<AuthSignInResult>>;

  /** Create account draft then return an OTP challenge for the phone. */
  signup(input: SignupInput, options?: RequestOptions): Promise<Result<OtpChallenge>>;

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
