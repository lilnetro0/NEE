import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";

/**
 * Client-side route guard for authenticated surfaces.
 * Redirects anonymous / expired sessions to login after boot completes.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (auth.phase === "booting") return;
    if (auth.phase === "authenticated" || auth.phase === "locked") return;
    void nav({ to: "/auth/login" });
  }, [auth.phase, nav]);

  if (auth.phase === "booting") {
    return (
      <MobileScreen>
        <TopBar title="" showBack={false} showCart={false} />
        <ScreenBody>
          <div className="grid min-h-[40dvh] place-items-center text-sm text-muted-foreground">
            …
          </div>
        </ScreenBody>
      </MobileScreen>
    );
  }

  if (auth.phase !== "authenticated" && auth.phase !== "locked") {
    return null;
  }

  return <>{children}</>;
}
