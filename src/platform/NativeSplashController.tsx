import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { usePlatform } from "./PlatformProvider";

/**
 * Hides the native launch splash (launchAutoHide is false) once the first
 * destination screen has painted, producing a single continuous startup
 * experience: OS splash → first screen. The "/" entry route only redirects,
 * so we wait until the router has left it before hiding.
 *
 * A hard fallback timer guarantees the splash can never stay up forever,
 * even if routing stalls.
 */
export function NativeSplashController() {
  const { splash } = usePlatform();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (hiddenRef.current || pathname === "/") return;
    hiddenRef.current = true;
    // Double rAF: hide only after the destination screen has committed a paint.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        void splash.hide();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname, splash]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hiddenRef.current) {
        hiddenRef.current = true;
        void splash.hide();
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [splash]);

  return null;
}
