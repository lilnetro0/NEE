import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { adminApi, type AdminMe } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  me: AdminMe | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      const data = await adminApi<AdminMe>("me", "get");
      setMe(data);
      setError(null);
    } catch (err) {
      setMe(null);
      setError(err instanceof Error ? err.message : "Not authorized for admin");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }
    void refreshMe();
  }, [session, refreshMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    if (signError) throw signError;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMe(null);
  }, []);

  const can = useCallback(
    (permission: string) => Boolean(me?.permissions.includes(permission)),
    [me],
  );

  const value = useMemo(
    () => ({ loading, session, user, me, error, signIn, signOut, refreshMe, can }),
    [loading, session, user, me, error, signIn, signOut, refreshMe, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
