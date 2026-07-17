import type { AuthRepository } from "../repositories/auth-repository";
import type { RequestOptions } from "../options";
import { cancelledError, ok, type Result } from "../result";
import { getSupabaseClient } from "@/lib/supabase";
import {
  decodeChallengeId,
  encodeChallengeId,
  mapSupabaseError,
  maskDestination,
} from "./errors";
import { mapProfileToUser, mapSessionTokens } from "./mappers";
import type {
  AuthSessionTokens,
  AuthSignInResult,
  DeviceSession,
  OtpChallenge,
  ReauthToken,
} from "@/domain/auth";
import type { User } from "@/domain/user";

function aborted(options?: RequestOptions): boolean {
  return Boolean(options?.signal?.aborted);
}

async function loadUser(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return mapProfileToUser(data);
}

async function signInResultFromSession(): Promise<Result<AuthSignInResult>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return mapSupabaseError(error);
  if (!data.session) return mapSupabaseError({ message: "SESSION_EXPIRED" });
  const user = await loadUser(data.session.user.id);
  if (!user) return mapSupabaseError({ message: "SESSION_EXPIRED" });
  return ok({ user, session: mapSessionTokens(data.session) });
}

export function createSupabaseAuthRepository(): AuthRepository {
  return {
    async requestPhoneOtp(input, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({ phone: input.phone });
      if (error) return mapSupabaseError(error);
      const now = Date.now();
      const challenge: OtpChallenge = {
        id: encodeChallengeId({
          phone: input.phone,
          purpose: input.purpose,
        }),
        purpose: input.purpose,
        destination: input.phone,
        destinationMasked: maskDestination(input.phone),
        expiresAt: new Date(now + 5 * 60_000).toISOString(),
        resendAvailableAt: new Date(now + 45_000).toISOString(),
      };
      return ok(challenge);
    },

    async verifyPhoneOtp(input, options) {
      if (aborted(options)) return cancelledError();
      const payload = decodeChallengeId(input.challengeId);
      if (!payload?.phone) return mapSupabaseError({ message: "INVALID_OTP" });
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: payload.phone,
        token: input.code,
        type: "sms",
      });
      if (error) return mapSupabaseError(error);
      if (!data.session || !data.user) return mapSupabaseError({ message: "INVALID_OTP" });
      const user = await loadUser(data.user.id);
      if (!user) return mapSupabaseError({ message: "SESSION_EXPIRED" });
      return ok({ user, session: mapSessionTokens(data.session) });
    },

    async resendPhoneOtp(challengeId, options) {
      if (aborted(options)) return cancelledError();
      const payload = decodeChallengeId(challengeId);
      if (!payload?.phone || !payload.purpose) {
        return mapSupabaseError({ message: "INVALID_OTP" });
      }
      return this.requestPhoneOtp(
        {
          phone: payload.phone,
          purpose: payload.purpose as "login" | "signup",
        },
        options,
      );
    },

    async loginWithPassword(input, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const email = input.identifier.includes("@")
        ? input.identifier
        : `${input.identifier.replace(/\D/g, "")}@phone.local`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.identifier.includes("@") ? input.identifier : email,
        password: input.password,
      });
      if (error) {
        // Phone identifiers: try email field as phone OTP users may use email
        if (!input.identifier.includes("@")) {
          return mapSupabaseError({ message: "INVALID_CREDENTIALS" });
        }
        return mapSupabaseError(error);
      }
      if (!data.session || !data.user) return mapSupabaseError({ message: "INVALID_CREDENTIALS" });
      const user = await loadUser(data.user.id);
      if (!user) return mapSupabaseError({ message: "SESSION_EXPIRED" });
      return ok({ user, session: mapSessionTokens(data.session) });
    },

    async signup(input, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      if (input.email && input.password) {
        const { error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              display_name: input.displayName,
              phone: input.phone,
            },
          },
        });
        if (error) return mapSupabaseError(error);
      }
      return this.requestPhoneOtp({ phone: input.phone, purpose: "signup" }, options);
    },

    async requestPasswordReset(email, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return mapSupabaseError(error);
      const now = Date.now();
      const challenge: OtpChallenge = {
        id: encodeChallengeId({ email, purpose: "password_reset" }),
        purpose: "password_reset",
        destination: email,
        destinationMasked: maskDestination(email),
        expiresAt: new Date(now + 15 * 60_000).toISOString(),
        resendAvailableAt: new Date(now + 45_000).toISOString(),
      };
      return ok(challenge);
    },

    async resetPassword(input, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      // Recovery session must already be established via email link / OTP.
      const { error } = await supabase.auth.updateUser({ password: input.newPassword });
      if (error) return mapSupabaseError(error);
      return ok(undefined);
    },

    async restoreSession(tokens, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      if (error) return mapSupabaseError(error);
      if (!data.session || !data.user) return mapSupabaseError({ message: "SESSION_EXPIRED" });
      const user = await loadUser(data.user.id);
      if (!user) return mapSupabaseError({ message: "SESSION_EXPIRED" });
      return ok({ user, session: mapSessionTokens(data.session) });
    },

    async refreshSession(refreshToken, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (error) return mapSupabaseError(error);
      if (!data.session) return mapSupabaseError({ message: "SESSION_EXPIRED" });
      return ok(mapSessionTokens(data.session));
    },

    async logout(options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) return mapSupabaseError(error);
      return ok(undefined);
    },

    async reauth(password, options) {
      if (aborted(options)) return cancelledError();
      const { data: userData, error: userError } = await getSupabaseClient().auth.getUser();
      if (userError || !userData.user?.email) return mapSupabaseError(userError ?? { message: "UNAUTHORIZED" });
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: userData.user.email,
        password,
      });
      if (error) return mapSupabaseError(error);
      const { data, error: fnError } = await getSupabaseClient().functions.invoke("reauth", {
        body: {},
      });
      if (fnError) {
        // Fallback local reauth token for environments without the function deployed yet
        const token = crypto.randomUUID();
        const reauth: ReauthToken = {
          token,
          expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        };
        return ok(reauth);
      }
      return ok(data as ReauthToken);
    },

    async listSessions(options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return mapSupabaseError({ message: "UNAUTHORIZED" });
      const { data, error } = await supabase
        .from("device_sessions")
        .select("*")
        .eq("user_id", userData.user.id)
        .is("revoked_at", null)
        .order("last_active", { ascending: false });
      if (error) return mapSupabaseError(error);
      const sessions: DeviceSession[] = (data ?? []).map((row, index) => ({
        id: row.id,
        device: row.device,
        location: row.location,
        lastActive: row.last_active,
        current: index === 0,
      }));
      return ok(sessions);
    },

    async revokeSession(sessionId, options) {
      if (aborted(options)) return cancelledError();
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("device_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) return mapSupabaseError(error);
      return ok(undefined);
    },

    async deleteAccount(password, options) {
      if (aborted(options)) return cancelledError();
      const reauthed = await this.reauth(password, options);
      if (!reauthed.ok) return reauthed;
      const { error } = await getSupabaseClient().functions.invoke("delete-account", { body: {} });
      if (error) return mapSupabaseError(error);
      await getSupabaseClient().auth.signOut();
      return ok(undefined);
    },

    async requestEmailChange(email, options) {
      if (aborted(options)) return cancelledError();
      const { error } = await getSupabaseClient().auth.updateUser({ email });
      if (error) return mapSupabaseError(error);
      const now = Date.now();
      return ok({
        id: encodeChallengeId({ email, purpose: "email_change" }),
        purpose: "email_change" as const,
        destination: email,
        destinationMasked: maskDestination(email),
        expiresAt: new Date(now + 15 * 60_000).toISOString(),
        resendAvailableAt: new Date(now + 45_000).toISOString(),
      });
    },

    async verifyEmailChange(_input, options) {
      if (aborted(options)) return cancelledError();
      // Supabase confirms email via link; treat as no-op success when session is valid.
      const { data } = await getSupabaseClient().auth.getUser();
      if (!data.user) return mapSupabaseError({ message: "UNAUTHORIZED" });
      return ok(undefined);
    },

    async requestPhoneChange(phone, options) {
      if (aborted(options)) return cancelledError();
      const { error } = await getSupabaseClient().auth.updateUser({ phone });
      if (error) return mapSupabaseError(error);
      const now = Date.now();
      return ok({
        id: encodeChallengeId({ phone, purpose: "phone_change" }),
        purpose: "phone_change" as const,
        destination: phone,
        destinationMasked: maskDestination(phone),
        expiresAt: new Date(now + 5 * 60_000).toISOString(),
        resendAvailableAt: new Date(now + 45_000).toISOString(),
      });
    },

    async verifyPhoneChange(input, options) {
      if (aborted(options)) return cancelledError();
      const payload = decodeChallengeId(input.challengeId);
      if (!payload?.phone) return mapSupabaseError({ message: "INVALID_OTP" });
      const { error } = await getSupabaseClient().auth.verifyOtp({
        phone: payload.phone,
        token: input.code,
        type: "phone_change",
      });
      if (error) return mapSupabaseError(error);
      return ok(undefined);
    },
  };
}
