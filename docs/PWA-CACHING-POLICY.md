# PWA caching policy

## Manifest

`public/manifest.webmanifest`

- `name` / `short_name`: **NETRO**
- `display`: `standalone`
- `theme_color` / `background_color`: `#0d0f1a`
- Icons: `/favicon.ico`, `/icons/icon-192.png`, `/icons/icon-512.png`
- `start_url`: `/home`

## Service worker strategy (required when SW is registered)

Use **network-first** (or no cache) for application shell navigation after version bumps, and an **update prompt** when a new SW is waiting (`skipWaiting` only after user confirms).

Static hashed assets (`/assets/*`) may use long-cache immutable headers.

## Never cache (routes)

Do not Cache-API / SW-cache these navigations or their HTML shells as durable offline content:

| Route pattern | Reason |
|---------------|--------|
| `/checkout*` | Quote + payment state must be fresh |
| `/order/*` | May contain fulfillment / code reveal UI |
| `/auth/*`, `/login`, `/signup` | Session-sensitive |
| `/account/*` | Authenticated profile |
| `/payment*` | Payment pages |
| Any URL containing a code or token query param | Codes must never appear in URLs or caches |

Offline fallback: `public/offline.html` (generic “you’re offline” only — no cart/order/code data).

## Never cache (API responses)

Authenticated NETRO API responses must not be stored in the Cache Storage API:

- `GET /v1/me`, sessions, devices
- `GET /v1/orders*`, fulfillment, refunds
- `POST /v1/checkout/quotes`, payments, order create
- Any `reveal-code` / digital delivery payload
- Cart checkout quotes and payment intents

Public catalog (`GET /v1/products`, categories, brands) may use short TTL network-first caching only if the backend sets explicit cache headers — still never include supplier identifiers in client caches beyond NETRO product IDs.

## Headers (static host)

See `public/_headers`:

- `/assets/*` → long immutable cache
- HTML / app shell → `no-cache` / revalidate
- Manifest → short TTL

## Safe areas

Existing shell safe-area padding must remain intact for standalone PWA / notch devices.
