/**
 * Platform abstraction layer.
 *
 * All browser APIs go through these adapters so we can swap them for Capacitor
 * plugins later without touching UI code. Each adapter has a web implementation
 * today; native builds replace the module at bundle time.
 *
 * Do NOT import `navigator.clipboard`, `window.open`, `localStorage` for
 * sensitive data, `Notification`, etc. from UI code — go through here.
 */

// ============ Clipboard ============

export const clipboard = {
  async writeText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard?.writeText(text);
      return true;
    } catch {
      return false;
    }
  },
};

// ============ Secure storage (sensitive) ============
// Web fallback: sessionStorage (cleared on tab close). Native: Keychain / Keystore.
// Never use for anything with long-lived user credentials on the web build.

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return typeof window !== "undefined" ? sessionStorage.getItem(`ss:${key}`) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== "undefined") sessionStorage.setItem(`ss:${key}`, value);
    } catch {}
  },
  async remove(key: string): Promise<void> {
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem(`ss:${key}`);
    } catch {}
  },
};

// ============ Preferences (non-sensitive) ============
// Locale, theme, cart draft, favorites, region, etc. Never store auth tokens
// or order codes here.

export const preferences = {
  get(key: string): string | null {
    try {
      return typeof window !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      if (typeof window !== "undefined") localStorage.setItem(key, value);
    } catch {}
  },
  remove(key: string): void {
    try {
      if (typeof window !== "undefined") localStorage.removeItem(key);
    } catch {}
  },
};

// ============ Notifications ============

export const notifications = {
  async requestPermission(): Promise<"granted" | "denied" | "default"> {
    try {
      if (typeof Notification === "undefined") return "denied";
      return (await Notification.requestPermission()) as "granted" | "denied" | "default";
    } catch {
      return "denied";
    }
  },
  async show(title: string, body: string): Promise<void> {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    } catch {}
  },
};

// ============ External URLs / deep links ============

export const externalUrl = {
  open(url: string): void {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  },
};

export const deepLinks = {
  /** Register a handler for incoming app deep links. Web is a no-op. */
  onOpen(_handler: (url: string) => void): () => void {
    return () => {};
  },
};

// ============ Device info ============

export type DeviceInfo = {
  platform: "web" | "ios" | "android";
  osVersion: string;
  appVersion: string;
  model?: string;
  locale: string;
};

export const device = {
  info(): DeviceInfo {
    const platform: DeviceInfo["platform"] =
      typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? "ios"
        : typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)
        ? "android"
        : "web";
    return {
      platform,
      osVersion: "web",
      appVersion: "1.0.0",
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
    };
  },
};

// ============ Payment-return handling ============
// Callback surface for 3DS / hosted checkout returns. Web: URL parse.
// Native: universal / app links.

export type PaymentReturn = {
  status: "success" | "cancelled" | "failed" | "pending";
  paymentIntentId?: string;
  reason?: string;
};

export const paymentReturn = {
  parse(search: URLSearchParams): PaymentReturn | null {
    const status = search.get("payment_status");
    if (!status) return null;
    return {
      status: status as PaymentReturn["status"],
      paymentIntentId: search.get("pi") ?? undefined,
      reason: search.get("reason") ?? undefined,
    };
  },
};
