import type {
  AppVersionInformation,
  ConnectivityStatus,
  DeviceInformation,
  NotificationPermission,
  PlatformServices,
  ReceiptDocument,
  ShareOutcome,
} from "../contracts";
import { assertNotSensitiveLocalStorageKey } from "@/lib/security";

const SECURE_PREFIX = "ss:";

function notificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "default") return "prompt";
  return Notification.permission;
}

function decodeReceipt(document: ReceiptDocument): Blob {
  if (document.encoding === "utf8") {
    return new Blob([document.data], { type: document.mimeType });
  }

  const binary = atob(document.data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: document.mimeType });
}

function webConnectivity(): ConnectivityStatus {
  if (typeof navigator === "undefined") {
    return { connected: true, connectionType: "unknown" };
  }

  const connected = navigator.onLine;
  const connection = (
    navigator as Navigator & {
      connection?: { type?: string; effectiveType?: string };
    }
  ).connection;
  const rawType = connection?.type ?? connection?.effectiveType;
  const connectionType: ConnectivityStatus["connectionType"] = !connected
    ? "none"
    : rawType === "wifi"
      ? "wifi"
      : rawType === "cellular" || rawType?.includes("g")
        ? "cellular"
        : rawType === "ethernet"
          ? "ethernet"
          : "unknown";

  return { connected, connectionType };
}

/**
 * Browser/PWA implementation. A new object is created per PlatformProvider
 * mount, keeping services injectable in tests and replaceable in native builds.
 */
export function createWebPlatform(): PlatformServices {
  return {
    splash: {
      async hide() {
        // Browsers have no native launch splash.
      },
    },

    secureStorage: {
      async get(key) {
        try {
          return typeof sessionStorage === "undefined"
            ? null
            : sessionStorage.getItem(`${SECURE_PREFIX}${key}`);
        } catch {
          return null;
        }
      },
      async set(key, value) {
        try {
          sessionStorage.setItem(`${SECURE_PREFIX}${key}`, value);
        } catch {
          // Storage can be unavailable or full; callers should not assume persistence.
        }
      },
      async remove(key) {
        try {
          sessionStorage.removeItem(`${SECURE_PREFIX}${key}`);
        } catch {
          // Removal is best effort.
        }
      },
    },

    preferences: {
      async get(key) {
        try {
          assertNotSensitiveLocalStorageKey(key);
          return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      async set(key, value) {
        try {
          assertNotSensitiveLocalStorageKey(key);
          localStorage.setItem(key, value);
        } catch {
          // Preference persistence is best effort; sensitive keys are refused.
        }
      },
      async remove(key) {
        try {
          assertNotSensitiveLocalStorageKey(key);
          localStorage.removeItem(key);
        } catch {
          // Removal is best effort.
        }
      },
    },

    clipboard: {
      async writeText(text) {
        try {
          if (!navigator.clipboard) return false;
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return false;
        }
      },
    },

    externalUrls: {
      async open(url) {
        try {
          return window.open(url, "_blank", "noopener,noreferrer") !== null;
        } catch {
          return false;
        }
      },
    },

    deepLinks: {
      async getInitialUrl() {
        return typeof window === "undefined" ? null : window.location.href;
      },
      onOpen(handler) {
        if (typeof window === "undefined") return () => undefined;
        const listener = () => handler(window.location.href);
        window.addEventListener("popstate", listener);
        window.addEventListener("hashchange", listener);
        return () => {
          window.removeEventListener("popstate", listener);
          window.removeEventListener("hashchange", listener);
        };
      },
    },

    notifications: {
      async getPermission() {
        return notificationPermission();
      },
      async requestPermission() {
        try {
          if (typeof Notification === "undefined") return "unsupported";
          await Notification.requestPermission();
          return notificationPermission();
        } catch {
          return "denied";
        }
      },
      async showLocal(title, body) {
        try {
          if (notificationPermission() !== "granted") return false;
          new Notification(title, { body });
          return true;
        } catch {
          return false;
        }
      },
    },

    device: {
      async getInfo(): Promise<DeviceInformation> {
        const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
        const platform: DeviceInformation["platform"] = /iPhone|iPad|iPod/i.test(userAgent)
          ? "ios"
          : /Android/i.test(userAgent)
            ? "android"
            : "web";
        return {
          platform,
          operatingSystem: platform === "web" ? "web" : platform,
          osVersion: "web",
          locale: typeof navigator === "undefined" ? "en" : navigator.language,
        };
      },
    },

    appVersion: {
      async getInfo(): Promise<AppVersionInformation> {
        return { version: "1.0.0" };
      },
    },

    sharing: {
      async share(content): Promise<ShareOutcome> {
        if (typeof navigator === "undefined" || !navigator.share) return "unsupported";
        try {
          await navigator.share(content);
          return "shared";
        } catch (error) {
          return error instanceof DOMException && error.name === "AbortError"
            ? "cancelled"
            : "failed";
        }
      },
    },

    receipts: {
      async save(document) {
        if (typeof window === "undefined") return false;
        try {
          const url = URL.createObjectURL(decodeReceipt(document));
          const anchor = window.document.createElement("a");
          anchor.href = url;
          anchor.download = document.filename;
          anchor.click();
          URL.revokeObjectURL(url);
          return true;
        } catch {
          return false;
        }
      },
    },

    haptics: {
      async impact(style = "light") {
        if (typeof navigator === "undefined" || !navigator.vibrate) return false;
        const duration = style === "heavy" ? 40 : style === "medium" ? 25 : 12;
        return navigator.vibrate(duration);
      },
      async notification(type) {
        if (typeof navigator === "undefined" || !navigator.vibrate) return false;
        const pattern =
          type === "success" ? [15, 30, 15] : type === "warning" ? [25, 30, 25] : [40];
        return navigator.vibrate(pattern);
      },
    },

    connectivity: {
      async getStatus() {
        return webConnectivity();
      },
      subscribe(handler) {
        if (typeof window === "undefined") return () => undefined;
        const listener = () => handler(webConnectivity());
        window.addEventListener("online", listener);
        window.addEventListener("offline", listener);
        return () => {
          window.removeEventListener("online", listener);
          window.removeEventListener("offline", listener);
        };
      },
    },

    /**
     * Web has no OS biometrics. Preference is stored in ordinary preferences
     * (not a secret). Unlock always reports unavailable — native shells inject
     * a real Keychain/Biometric plugin implementation.
     */
    localUnlock: {
      async isAvailable() {
        return false;
      },
      async isEnabled() {
        try {
          return localStorage.getItem("pref:auth.localUnlockEnabled") === "1";
        } catch {
          return false;
        }
      },
      async setEnabled(enabled) {
        try {
          if (enabled) localStorage.setItem("pref:auth.localUnlockEnabled", "1");
          else localStorage.removeItem("pref:auth.localUnlockEnabled");
        } catch {
          // ignore
        }
      },
      async unlock() {
        return "unavailable";
      },
    },
  };
}
