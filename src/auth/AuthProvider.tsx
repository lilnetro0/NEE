import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_SECURE_REAUTH_KEY,
  type AuthSessionTokens,
  type AuthUiPhase,
  type OtpChallenge,
} from "@/domain/auth";
import type { User } from "@/domain/user";
import type { AppError } from "@/data-access/result";
import { useRepositories } from "@/data-access/RepositoriesProvider";
import { usePlatform } from "@/platform/PlatformProvider";
import {
  clearStoredSessionTokens,
  readStoredSessionTokens,
  resolveAuthSessionPolicy,
  writeStoredSessionTokens,
} from "@/auth/session-policy";

function mapErrorToPhase(error: AppError): AuthUiPhase {
  if (error.code === "network" || error.message === "NETWORK_ERROR") return "network_error";
  if (error.code === "rate_limited" || error.message === "RATE_LIMITED") return "rate_limited";
  if (error.message === "OTP_EXPIRED") return "expired_otp";
  if (error.message === "INVALID_OTP" || error.message === "INVALID_CODE") return "invalid_otp";
  if (error.message === "SESSION_EXPIRED") return "session_expired";
  return "anonymous";
}

type AuthContextValue = {
  phase: AuthUiPhase;
  user: User | null;
  challenge: OtpChallenge | null;
  lastError: AppError | null;
  isAuthenticated: boolean;
  /** Persist session via secureStorage and update UI state. */
  applySignIn: (user: User, session: AuthSessionTokens) => Promise<void>;
  clearSession: () => Promise<void>;
  setPhase: (phase: AuthUiPhase) => void;
  setChallenge: (challenge: OtpChallenge | null) => void;
  setLastError: (error: AppError | null) => void;
  mapErrorToPhase: (error: AppError) => AuthUiPhase;
  /** Short-lived reauth token for sensitive actions. */
  storeReauthToken: (token: string) => Promise<void>;
  getReauthToken: () => Promise<string | null>;
  clearReauthToken: () => Promise<void>;
  /** Local device lock — not a backend identity. */
  lockSession: () => Promise<void>;
  unlockSessionLocally: () => Promise<"unlocked" | "cancelled" | "unavailable" | "failed">;
  requestPhoneOtp: (phone: string, purpose: "login" | "signup") => Promise<boolean>;
  verifyPhoneOtp: (code: string) => Promise<boolean>;
  resendPhoneOtp: () => Promise<boolean>;
  loginWithPassword: (identifier: string, password: string) => Promise<boolean>;
  signup: (input: {
    displayName: string;
    phone: string;
    email?: string;
    password?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Separates authentication UI state from AuthRepository / secureStorage.
 * Screens consume this hook; they never touch tokens or localStorage directly.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useRepositories();
  const { secureStorage, localUnlock } = usePlatform();
  const [phase, setPhase] = useState<AuthUiPhase>("booting");
  const [user, setUser] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [lastError, setLastError] = useState<AppError | null>(null);
  const [session, setSession] = useState<AuthSessionTokens | null>(null);

  const clearSession = useCallback(async () => {
    await clearStoredSessionTokens(secureStorage);
    await secureStorage.remove(AUTH_SECURE_REAUTH_KEY);
    setSession(null);
    setUser(null);
    setChallenge(null);
    setLastError(null);
    setPhase("anonymous");
  }, [secureStorage]);

  const applySignIn = useCallback(
    async (nextUser: User, nextSession: AuthSessionTokens) => {
      // PWA production prefers HttpOnly cookies from the NETRO backend.
      // Secure-storage writes remain for Capacitor / session-marker bridges.
      const policy = resolveAuthSessionPolicy(false);
      if (policy.mode === "secure_storage" || policy.allowJsSessionMarker) {
        await writeStoredSessionTokens(secureStorage, nextSession);
      }
      setUser(nextUser);
      setSession(nextSession);
      setChallenge(null);
      setLastError(null);
      const unlockEnabled = await localUnlock.isEnabled();
      setPhase(unlockEnabled ? "locked" : "authenticated");
    },
    [secureStorage, localUnlock],
  );

  // Session restoration on boot — tokens only from secureStorage / cookies.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const tokensFromStore = await readStoredSessionTokens(secureStorage);
        if (!active) return;
        if (!tokensFromStore) {
          setPhase("anonymous");
          return;
        }
        let tokens: AuthSessionTokens = tokensFromStore;

        if (Date.parse(tokens.expiresAt) <= Date.now()) {
          const refreshed = await auth.refreshSession(tokens.refreshToken);
          if (!active) return;
          if (!refreshed.ok) {
            await clearStoredSessionTokens(secureStorage);
            setPhase("session_expired");
            setLastError(refreshed.error);
            return;
          }
          tokens = refreshed.data;
          await writeStoredSessionTokens(secureStorage, tokens);
        }

        const restored = await auth.restoreSession(tokens);
        if (!active) return;
        if (!restored.ok) {
          await clearStoredSessionTokens(secureStorage);
          setPhase("session_expired");
          setLastError(restored.error);
          return;
        }
        setUser(restored.data.user);
        setSession(restored.data.session);
        const unlockEnabled = await localUnlock.isEnabled();
        setPhase(unlockEnabled ? "locked" : "authenticated");
      } catch {
        if (active) setPhase("anonymous");
      }
    })();
    return () => {
      active = false;
    };
  }, [auth, secureStorage, localUnlock]);

  const requestPhoneOtp = useCallback(
    async (phone: string, purpose: "login" | "signup") => {
      setPhase("loading");
      setLastError(null);
      const result = await auth.requestPhoneOtp({ phone, purpose });
      if (!result.ok) {
        setLastError(result.error);
        setPhase(mapErrorToPhase(result.error));
        return false;
      }
      setChallenge(result.data);
      setPhase("awaiting_otp");
      return true;
    },
    [auth],
  );

  const verifyPhoneOtp = useCallback(
    async (code: string) => {
      if (!challenge) {
        setPhase("expired_otp");
        return false;
      }
      setPhase("loading");
      setLastError(null);
      const result = await auth.verifyPhoneOtp({ challengeId: challenge.id, code });
      if (!result.ok) {
        setLastError(result.error);
        setPhase(mapErrorToPhase(result.error));
        return false;
      }
      await applySignIn(result.data.user, result.data.session);
      return true;
    },
    [auth, challenge, applySignIn],
  );

  const resendPhoneOtp = useCallback(async () => {
    if (!challenge) {
      setPhase("expired_otp");
      return false;
    }
    setPhase("loading");
    setLastError(null);
    const result = await auth.resendPhoneOtp(challenge.id);
    if (!result.ok) {
      setLastError(result.error);
      setPhase(mapErrorToPhase(result.error));
      return false;
    }
    setChallenge(result.data);
    setPhase("awaiting_otp");
    return true;
  }, [auth, challenge]);

  const loginWithPassword = useCallback(
    async (identifier: string, password: string) => {
      setPhase("loading");
      setLastError(null);
      const result = await auth.loginWithPassword({ identifier, password });
      if (!result.ok) {
        setLastError(result.error);
        setPhase(mapErrorToPhase(result.error));
        return false;
      }
      await applySignIn(result.data.user, result.data.session);
      return true;
    },
    [auth, applySignIn],
  );

  const signup = useCallback(
    async (input: { displayName: string; phone: string; email?: string; password?: string }) => {
      setPhase("loading");
      setLastError(null);
      const result = await auth.signup(input);
      if (!result.ok) {
        setLastError(result.error);
        setPhase(mapErrorToPhase(result.error));
        return false;
      }
      setChallenge(result.data);
      setPhase("awaiting_otp");
      return true;
    },
    [auth],
  );

  const logout = useCallback(async () => {
    await auth.logout();
    await clearSession();
  }, [auth, clearSession]);

  const storeReauthToken = useCallback(
    async (token: string) => {
      await secureStorage.set(AUTH_SECURE_REAUTH_KEY, token);
    },
    [secureStorage],
  );

  const getReauthToken = useCallback(async () => {
    return secureStorage.get(AUTH_SECURE_REAUTH_KEY);
  }, [secureStorage]);

  const clearReauthToken = useCallback(async () => {
    await secureStorage.remove(AUTH_SECURE_REAUTH_KEY);
  }, [secureStorage]);

  const lockSession = useCallback(async () => {
    if (session && user) setPhase("locked");
  }, [session, user]);

  const unlockSessionLocally = useCallback(async () => {
    const result = await localUnlock.unlock();
    if (result === "unlocked") setPhase("authenticated");
    return result;
  }, [localUnlock]);

  const value = useMemo<AuthContextValue>(
    () => ({
      phase,
      user,
      challenge,
      lastError,
      isAuthenticated: phase === "authenticated" || phase === "locked",
      applySignIn,
      clearSession,
      setPhase,
      setChallenge,
      setLastError,
      mapErrorToPhase,
      storeReauthToken,
      getReauthToken,
      clearReauthToken,
      lockSession,
      unlockSessionLocally,
      requestPhoneOtp,
      verifyPhoneOtp,
      resendPhoneOtp,
      loginWithPassword,
      signup,
      logout,
    }),
    [
      phase,
      user,
      challenge,
      lastError,
      applySignIn,
      clearSession,
      storeReauthToken,
      getReauthToken,
      clearReauthToken,
      lockSession,
      unlockSessionLocally,
      requestPhoneOtp,
      verifyPhoneOtp,
      resendPhoneOtp,
      loginWithPassword,
      signup,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
