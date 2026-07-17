/**
 * Native Capacitor platform services.
 * Preferences backs secureStorage (and non-sensitive preferences) on device.
 * Other services reuse the web implementations until dedicated plugins are added.
 */
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
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

export function createNativePlatform(): PlatformServices {
  const web = createWebPlatform();
  const platform: DeviceInformation["platform"] =
    Capacitor.getPlatform() === "ios" ? "ios" : "android";

  return {
    ...web,
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
