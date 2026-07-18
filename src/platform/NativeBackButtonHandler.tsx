import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { App } from "@capacitor/app";
import { isNativeRuntime } from "./native/createNativePlatform";

const ROOT_PATHS = new Set(["/", "/home", "/onboarding"]);

/**
 * Android hardware/gesture back: pop the SPA history stack; minimize the app
 * when already on a root screen (standard Android behavior — never trap the
 * user, never exit abruptly mid-flow).
 */
export function NativeBackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeRuntime()) return;
    let remove: (() => void) | undefined;
    void App.addListener("backButton", () => {
      if (ROOT_PATHS.has(router.state.location.pathname)) {
        void App.minimizeApp();
      } else {
        router.history.back();
      }
    }).then((handle) => {
      remove = () => {
        void handle.remove();
      };
    });
    return () => {
      remove?.();
    };
  }, [router]);

  return null;
}
