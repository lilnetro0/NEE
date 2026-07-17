# Frontend security

## Non-negotiables

1. **No secrets in the frontend** — no supplier, payment, or DB credentials in code or `VITE_*`.
2. **No auth tokens in `localStorage`** — PWA prefers HttpOnly Secure SameSite cookies; Capacitor uses secure storage.
3. **No gift-card codes in URLs, analytics, or logs**.
4. **Codes masked by default**; clear reveal state when leaving the order screen.
5. **LTR** for codes, emails, phones, and Player IDs inside Arabic RTL layouts (`LTR_ATTR` / `dir="ltr"`).
6. **No `eval`** and no unsanitized dynamic HTML.
7. External links use `rel="noopener noreferrer"` (`externalLinkProps`).

## Content Security Policy

Canonical requirements live in `src/lib/security.ts` (`CSP_REQUIREMENTS`) and are documented in `public/_headers` for static hosts:

- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- `font-src 'self' https://fonts.gstatic.com data:`
- `img-src 'self' data: blob: https:`
- `connect-src 'self' https:` (tighten to the NETRO API origin in production)
- `frame-ancestors 'none'`
- `object-src 'none'`

Tighten `connect-src` to the exact API origin when the backend hostname is known.

## Input & uploads

- `INPUT_LIMITS` — description, short text, phone, email, OTP length caps.
- Support attachments: max 5 MB; images + PDF only (`SUPPORT_ATTACHMENT_LIMITS`).

## Storage policy

| Data | Allowed storage |
|------|-----------------|
| Locale, theme, cart draft, favorites | Preferences / localStorage |
| Auth tokens / session | HttpOnly cookies (PWA) or secure storage (native) |
| OTP / gift-card codes | Memory only after authenticated reveal; never preferences |
| Payment details | Never on device storage from the frontend |

`assertNotSensitiveLocalStorageKey` refuses sensitive preference keys.

## Logging

`src/lib/logger.ts` scrubs tokens, OTPs, codes, emails, phones, player/server IDs, payment and supplier fields. Do not bypass the logger with raw `console.log` of sensitive payloads in production paths.
