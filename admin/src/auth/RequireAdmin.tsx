import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import type { ReactNode } from "react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, session, me, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        Loading admin session…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-400">
            {error ?? "This account is not assigned an admin role."}
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Set profiles.is_admin = true or assign an admin_user_roles row, then sign in again.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
