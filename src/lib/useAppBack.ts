import { useCallback } from "react";
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";

/**
 * iOS-style back: pop the real history stack so the previous screen keeps its
 * state and scroll position (and matches the native edge-swipe gesture).
 * Falls back to a sensible parent route when the app was entered directly on
 * a deep screen (deep link, refresh) and there is nothing to pop.
 */
export function useAppBack(fallbackTo: string = "/home") {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const nav = useNavigate();

  return useCallback(() => {
    if (canGoBack) {
      router.history.back();
    } else {
      void nav({ to: fallbackTo as never, replace: true });
    }
  }, [canGoBack, router, nav, fallbackTo]);
}
