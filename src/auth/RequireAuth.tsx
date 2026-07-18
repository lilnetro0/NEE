import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { ListRowsSkeleton } from "@/components/common/Skeletons";

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
    // Session restore usually resolves in a few frames; a content-shaped
    // placeholder avoids a flash of blank screen or spinner.
    return (
      <MobileScreen>
        <TopBar title="" showBack={false} showCart={false} showNotif={false} />
        <ScreenBody>
          <ListRowsSkeleton count={4} />
        </ScreenBody>
      </MobileScreen>
    );
  }

  if (auth.phase !== "authenticated" && auth.phase !== "locked") {
    return null;
  }

  return <>{children}</>;
}
