import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner } from "@/components/ui";

export function LoginPage() {
  const { session, me, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (session && me) return <Navigate to={from} replace />;

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form
        className="card w-full max-w-md space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          void signIn(email, password)
            .then(() => nav(from, { replace: true }))
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Sign-in failed");
            })
            .finally(() => setBusy(false));
        }}
      >
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">NETRO</div>
          <h1 className="text-2xl font-black">Admin sign in</h1>
        </div>
        {error ? <ErrorBanner message={error} /> : null}
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="btn w-full" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
