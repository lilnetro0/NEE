/**
 * Frontend security helpers — keep sensitive values out of storage, URLs, and logs.
 */

/** Prefer LTR for codes, emails, phones, and player IDs inside RTL layouts. */
export const LTR_ATTR = { dir: "ltr" as const };

const SENSITIVE_STORAGE_KEYS = [
  "token",
  "access",
  "refresh",
  "otp",
  "code",
  "password",
  "reauth",
  "gift",
  "pin",
];

export function assertNotSensitiveLocalStorageKey(key: string): void {
  const lower = key.toLowerCase();
  if (SENSITIVE_STORAGE_KEYS.some((part) => lower.includes(part))) {
    throw new Error(
      `Refusing to use preference/localStorage for sensitive key "${key}". Use secureStorage or cookies.`,
    );
  }
}

/** Mask a digital code for default display. */
export function maskDigitalCode(code: string): string {
  if (code.length <= 4) return "••••";
  return `${"•".repeat(Math.max(4, code.length - 4))}${code.slice(-4)}`;
}

export function externalLinkProps(url: string): {
  href: string;
  target: "_blank";
  rel: "noopener noreferrer";
} {
  return {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
  };
}

/** Attachment limits for support uploads (metadata only today). */
export const SUPPORT_ATTACHMENT_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  accept: "image/*,application/pdf",
} as const;

export const INPUT_LIMITS = {
  description: 1000,
  shortText: 120,
  phone: 20,
  email: 254,
  otp: 6,
} as const;

/**
 * Content-Security-Policy requirements for production hosting.
 * Applied via `public/_headers` (Cloudflare/Nitro) — keep in sync with deploy config.
 */
export const CSP_REQUIREMENTS = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");
