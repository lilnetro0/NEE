/**
 * Native Capacitor platform services.
 * Preferences backs secureStorage (and non-sensitive preferences) on device.
 * App + StatusBar plugins improve deep-link and chrome readiness on device.
 */
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import type { DeviceInformation, PlatformServices } from "../contracts";
import { createWebPlatform } from "../web/createWebPlatform";
import { assertNotSensitiveLocalStorageKey } from "@/lib/security";

const SECURE_PREFIX = "ss:";

export function isNativeRuntime(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function configureNativeChrome(): Promise<void> {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0B1220" });
    }
  } catch {
    // StatusBar may be unavailable in some embeds; ignore.
  }
}

export function createNativePlatform(): PlatformServices {
  const web = createWebPlatform();
  const platform: DeviceInformation["platform"] =
    Capacitor.getPlatform() === "ios" ? "ios" : "android";

  void configureNativeChrome();

  return {
    ...web,
    splash: {
      async hide() {
        try {
          // Fade keeps the handoff from the native splash to the first React
          // paint from flashing (launchAutoHide is false in capacitor.config).
          await SplashScreen.hide({ fadeOutDuration: 200 });
        } catch {
          // Plugin unavailable (e.g. stale native shell) — never block startup.
        }
      },
    },
    haptics: {
      async impact(style = "light") {
        try {
          const map = {
            light: ImpactStyle.Light,
            medium: ImpactStyle.Medium,
            heavy: ImpactStyle.Heavy,
          };
          await Haptics.impact({ style: map[style] });
          return true;
        } catch {
          return web.haptics.impact(style);
        }
      },
      async notification(type) {
        try {
          const map = {
            success: NotificationType.Success,
            warning: NotificationType.Warning,
            error: NotificationType.Error,
          };
          await Haptics.notification({ type: map[type] });
          return true;
        } catch {
          return web.haptics.notification(type);
        }
      },
    },
    secureStorage: {
      async get(key) {
        try {
          const { value } = await Preferences.get({ key: `${SECURE_PREFIX}${key}` });
          return value;
        } catch {
          return web.secureStorage.get(key);
        }
      },
      async set(key, value) {
        try {
          await Preferences.set({ key: `${SECURE_PREFIX}${key}`, value });
        } catch {
          await web.secureStorage.set(key, value);
        }
      },
      async remove(key) {
        try {
          await Preferences.remove({ key: `${SECURE_PREFIX}${key}` });
        } catch {
          await web.secureStorage.remove(key);
        }
      },
    },
    preferences: {
      async get(key) {
        try {
          assertNotSensitiveLocalStorageKey(key);
          const { value } = await Preferences.get({ key });
          return value;
        } catch {
          return web.preferences.get(key);
        }
      },
      async set(key, value) {
        try {
          assertNotSensitiveLocalStorageKey(key);
          await Preferences.set({ key, value });
        } catch {
          await web.preferences.set(key, value);
        }
      },
      async remove(key) {
        try {
          assertNotSensitiveLocalStorageKey(key);
          await Preferences.remove({ key });
        } catch {
          await web.preferences.remove(key);
        }
      },
    },
    deepLinks: {
      async getInitialUrl() {
        try {
          const launch = await App.getLaunchUrl();
          return launch?.url ?? null;
        } catch {
          return web.deepLinks.getInitialUrl();
        }
      },
      onOpen(handler) {
        let remove: (() => void) | undefined;
        void App.addListener("appUrlOpen", (event) => {
          if (event.url) handler(event.url);
        }).then((handle) => {
          remove = () => {
            void handle.remove();
          };
        });
        return () => {
          remove?.();
        };
      },
    },
    appVersion: {
      async getInfo() {
        try {
          const info = await App.getInfo();
          return { version: info.version, build: info.build };
        } catch {
          return web.appVersion.getInfo();
        }
      },
    },
    device: {
      async getInfo(): Promise<DeviceInformation> {
        return {
          platform,
          operatingSystem: platform,
          osVersion: "native",
          model: undefined,
          locale: typeof navigator === "undefined" ? "en" : navigator.language,
        };
      },
    },
  };
}
