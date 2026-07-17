import type {
  AuthSessionTokens,
  AuthSignInResult,
  DeviceSession,
  OtpChallenge,
  OtpPurpose,
} from "@/domain/auth";
import type { User } from "@/domain/user";
import type { RequestOptions } from "../options";
import { err, ok } from "../result";
import type {
  AuthRepository,
  PasswordLoginInput,
  RequestOtpInput,
  SignupInput,
  VerifyOtpInput,
} from "../repositories/auth-repository";
import { withMockLatency } from "./delay";

/** Mock OTP codes for UI testing — never treated as production secrets. */
export const MOCK_OTP_VALID = "123456";
export const MOCK_OTP_EXPIRED = "000000";

const MOCK_USER: User = {
  id: "user-ahmad",
  displayName: "Ahmad Al-Sayed",
  email: "ahmad@example.com",
  phone: "+966501234567",
  countryCode: "SA",
  preferredCurrency: "SAR",
  preferredLocale: "en",
  createdAt: new Date(Date.now() - 120 * 86400_000).toISOString(),
};

type LiveChallenge = OtpChallenge & {
  attempts: number;
  rateLimitedUntil?: number;
};

const challenges = new Map<string, LiveChallenge>();
let currentUser: User = { ...MOCK_USER };
let sessions: DeviceSession[] = [
  {
    id: "s1",
    device: "iPhone 15 Pro",
    location: "Riyadh, SA",
    lastActive: new Date().toISOString(),
    current: true,
  },
  {
    id: "s2",
    device: "MacBook Pro",
    location: "Riyadh, SA",
    lastActive: new Date(Date.now() - 3600_000).toISOString(),
    current: false,
  },
];

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `+${digits.slice(0, 3)}••••${digits.slice(-4)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••@•••";
  return `${local.slice(0, 1)}•••@${domain}`;
}

function issueChallenge(
  destination: string,
  purpose: OtpPurpose,
  kind: "phone" | "email",
): LiveChallenge {
  const id = `otp-${Date.now().toString(36)}`;
  const challenge: LiveChallenge = {
    id,
    purpose,
    destination,
    destinationMasked: kind === "phone" ? maskPhone(destination) : maskEmail(destination),
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    resendAvailableAt: new Date(Date.now() + 45_000).toISOString(),
    attempts: 0,
  };
  challenges.set(id, challenge);
  return challenge;
}

function toPublicChallenge(c: LiveChallenge): OtpChallenge {
  const { attempts: _a, rateLimitedUntil: _r, ...pub } = c;
  return pub;
}

function mintSession(userId: string): AuthSessionTokens {
  return {
    accessToken: `access-${userId}-${Date.now().toString(36)}`,
    refreshToken: `refresh-${userId}-${Date.now().toString(36)}`,
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    userId,
  };
}

function signInResult(): AuthSignInResult {
  return { user: { ...currentUser }, session: mintSession(currentUser.id) };
}

function isNetworkSim(value: string): boolean {
  return value.includes("000000000") || value.toLowerCase() === "network@fail.test";
}

function isRateLimitedPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").endsWith("429");
}

export function createMockAuthRepository(): AuthRepository {
  return {
    async requestPhoneOtp(input: RequestOtpInput, options?: RequestOptions) {
      return withMockLatency(
        280,
        () => {
          if (isNetworkSim(input.phone)) return err("network", "NETWORK_ERROR");
          if (isRateLimitedPhone(input.phone)) return err("rate_limited", "RATE_LIMITED");
          if (!/^\+?\d{8,15}$/.test(input.phone.replace(/\s/g, ""))) {
            return err("validation", "VALIDATION");
          }
          return ok(toPublicChallenge(issueChallenge(input.phone, input.purpose, "phone")));
        },
        options,
      );
    },

    async verifyPhoneOtp(input: VerifyOtpInput, options?: RequestOptions) {
      return withMockLatency(
        320,
        () => {
          const challenge = challenges.get(input.challengeId);
          if (!challenge) return err("validation", "OTP_EXPIRED");
          if (challenge.rateLimitedUntil && Date.now() < challenge.rateLimitedUntil) {
            return err("rate_limited", "RATE_LIMITED");
          }
          if (Date.now() > Date.parse(challenge.expiresAt) || input.code === MOCK_OTP_EXPIRED) {
            return err("validation", "OTP_EXPIRED");
          }
          if (input.code !== MOCK_OTP_VALID) {
            challenge.attempts += 1;
            if (challenge.attempts >= 3) {
              challenge.rateLimitedUntil = Date.now() + 60_000;
              return err("rate_limited", "RATE_LIMITED");
            }
            return err("validation", "INVALID_OTP");
          }
          if (challenge.purpose === "signup" && challenge.destination) {
            currentUser = { ...currentUser, phone: challenge.destination };
          }
          challenges.delete(input.challengeId);
          return ok(signInResult());
        },
        options,
      );
    },

    async resendPhoneOtp(challengeId: string, options?: RequestOptions) {
      return withMockLatency(
        250,
        () => {
          const existing = challenges.get(challengeId);
          if (!existing) return err("validation", "OTP_EXPIRED");
          if (existing.rateLimitedUntil && Date.now() < existing.rateLimitedUntil) {
            return err("rate_limited", "RATE_LIMITED");
          }
          if (Date.now() < Date.parse(existing.resendAvailableAt)) {
            return err("rate_limited", "RATE_LIMITED");
          }
          const next = issueChallenge(existing.destination, existing.purpose, "phone");
          challenges.delete(challengeId);
          return ok(toPublicChallenge(next));
        },
        options,
      );
    },

    async loginWithPassword(input: PasswordLoginInput, options?: RequestOptions) {
      return withMockLatency(
        350,
        () => {
          if (isNetworkSim(input.identifier)) return err("network", "NETWORK_ERROR");
          if (!input.password || input.password.length < 6) {
            return err("unauthorized", "INVALID_CREDENTIALS");
          }
          // Mock accepts any identifier matching seeded user email/phone with password length ≥ 6
          const id = input.identifier.trim().toLowerCase();
          const phoneOk = currentUser.phone?.includes(id.replace(/\D/g, "").slice(-4) ?? "");
          const emailOk = currentUser.email.toLowerCase() === id || id.includes("@");
          if (!phoneOk && !emailOk && id.length < 5) {
            return err("unauthorized", "INVALID_CREDENTIALS");
          }
          return ok(signInResult());
        },
        options,
      );
    },

    async signup(input: SignupInput, options?: RequestOptions) {
      return withMockLatency(
        300,
        () => {
          if (isNetworkSim(input.phone)) return err("network", "NETWORK_ERROR");
          if (isRateLimitedPhone(input.phone)) return err("rate_limited", "RATE_LIMITED");
          currentUser = {
            ...currentUser,
            displayName: input.displayName || currentUser.displayName,
            phone: input.phone,
            email: input.email?.trim() || currentUser.email,
          };
          return ok(toPublicChallenge(issueChallenge(input.phone, "signup", "phone")));
        },
        options,
      );
    },

    async requestPasswordReset(email: string, options?: RequestOptions) {
      return withMockLatency(
        280,
        () => {
          if (isNetworkSim(email)) return err("network", "NETWORK_ERROR");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("validation", "VALIDATION");
          return ok(toPublicChallenge(issueChallenge(email, "password_reset", "email")));
        },
        options,
      );
    },

    async resetPassword(input, options?: RequestOptions) {
      return withMockLatency(
        300,
        () => {
          const challenge = challenges.get(input.challengeId);
          if (!challenge) return err("validation", "OTP_EXPIRED");
          if (input.code === MOCK_OTP_EXPIRED) return err("validation", "OTP_EXPIRED");
          if (input.code !== MOCK_OTP_VALID) return err("validation", "INVALID_OTP");
          if (input.newPassword.length < 6) return err("validation", "VALIDATION");
          challenges.delete(input.challengeId);
          return ok(undefined);
        },
        options,
      );
    },

    async restoreSession(tokens: AuthSessionTokens, options?: RequestOptions) {
      return withMockLatency(
        120,
        () => {
          if (!tokens.accessToken || !tokens.refreshToken) {
            return err("unauthorized", "SESSION_EXPIRED");
          }
          if (Date.parse(tokens.expiresAt) <= Date.now()) {
            return err("unauthorized", "SESSION_EXPIRED");
          }
          return ok({ user: { ...currentUser }, session: tokens });
        },
        options,
      );
    },

    async refreshSession(refreshToken: string, options?: RequestOptions) {
      return withMockLatency(
        200,
        () => {
          if (!refreshToken.startsWith("refresh-")) {
            return err("unauthorized", "SESSION_EXPIRED");
          }
          return ok(mintSession(currentUser.id));
        },
        options,
      );
    },

    async logout(options?: RequestOptions) {
      return withMockLatency(100, () => ok(undefined), options);
    },

    async reauth(password: string, options?: RequestOptions) {
      return withMockLatency(
        300,
        () => {
          if (password.length < 6) return err("unauthorized", "INVALID_CREDENTIALS");
          return ok({
            token: `reauth-${Date.now()}`,
            expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
          });
        },
        options,
      );
    },

    async listSessions(options?: RequestOptions) {
      return withMockLatency(150, () => ok([...sessions]), options);
    },

    async revokeSession(sessionId: string, options?: RequestOptions) {
      return withMockLatency(
        200,
        () => {
          sessions = sessions.filter((s) => s.id !== sessionId);
          return ok(undefined);
        },
        options,
      );
    },

    async deleteAccount(password: string, options?: RequestOptions) {
      return withMockLatency(
        400,
        () => {
          if (password.length < 6) return err("unauthorized", "INVALID_CREDENTIALS");
          sessions = [];
          return ok(undefined);
        },
        options,
      );
    },

    async requestEmailChange(email: string, options?: RequestOptions) {
      return withMockLatency(
        200,
        () => {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("validation", "VALIDATION");
          return ok(toPublicChallenge(issueChallenge(email, "email_change", "email")));
        },
        options,
      );
    },

    async verifyEmailChange(input, options?: RequestOptions) {
      return withMockLatency(
        200,
        () => {
          const challenge = challenges.get(input.challengeId);
          if (!challenge) return err("validation", "OTP_EXPIRED");
          if (input.code !== MOCK_OTP_VALID) return err("validation", "INVALID_CODE");
          currentUser = { ...currentUser, email: challenge.destination };
          challenges.delete(input.challengeId);
          return ok(undefined);
        },
        options,
      );
    },

    async requestPhoneChange(phone: string, options?: RequestOptions) {
      return withMockLatency(
        200,
        () => {
          if (!/^\+?\d{8,15}$/.test(phone.replace(/\s/g, ""))) {
            return err("validation", "VALIDATION");
          }
          return ok(toPublicChallenge(issueChallenge(phone, "phone_change", "phone")));
        },
        options,
      );
    },

    async verifyPhoneChange(input, options?: RequestOptions) {
      return withMockLatency(
        200,
        () => {
          const challenge = challenges.get(input.challengeId);
          if (!challenge) return err("validation", "OTP_EXPIRED");
          if (input.code !== MOCK_OTP_VALID) return err("validation", "INVALID_CODE");
          currentUser = { ...currentUser, phone: challenge.destination };
          challenges.delete(input.challengeId);
          return ok(undefined);
        },
        options,
      );
    },
  };
}

/** Seeded user used by mock user/auth repos — for tests and getCurrent. */
export function getMockAuthUser(): User {
  return { ...currentUser };
}
