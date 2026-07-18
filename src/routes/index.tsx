import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { usePlatform } from "@/platform/PlatformProvider";

export const Route = createFileRoute("/")({
  component: Entry,
});

/**
 * App entry: decides between /home and /onboarding as soon as the stored
 * preference resolves (a few ms). There is intentionally no artificial delay
 * and no branded splash here — on native the OS splash screen is still
 * covering the WebView at this point (hidden by NativeSplashController once
 * the destination screen paints), so any UI rendered here is never seen.
 * On web this renders a plain background for a single frame.
 */
function Entry() {
  const nav = useNavigate();
  const { preferences } = usePlatform();

  useEffect(() => {
    let active = true;
    void preferences.get("netro:onboarded").then((value) => {
      if (!active) return;
      void nav({ to: value === "1" ? "/home" : "/onboarding", replace: true });
    });
    return () => {
      active = false;
    };
  }, [nav, preferences]);

  return <div className="min-h-[100dvh] bg-background" />;
}
