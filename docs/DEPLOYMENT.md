# Deployment

## Prerequisites

1. NETRO backend reachable over HTTPS.
2. Production env vars set at **build time** (Vite inlines `VITE_*`):

```env
VITE_APP_ENV=production
VITE_USE_MOCKS=false
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_DEV_TOOLS=false
VITE_APP_VERSION=<semver>
VITE_BUILD_SHA=<sha>
VITE_SENTRY_DSN=   # optional
```

3. Cookie auth: backend must set HttpOnly Secure cookies with correct `SameSite` / domain for the PWA origin.
4. CORS: allow the web origin with credentials if cookie auth is used.

## Build

```bash
bun install --frozen-lockfile
bun run prod:check
# or
bun run build
```

Artifacts: Vite / TanStack Start / Nitro output under `.output` (not classic Vite `dist`).

## Railway (Railpack)

Railpack picks Bun when `bun.lock` is present and runs `bun install --frozen-lockfile`.
After changing `package.json` / `package-lock.json`, regenerate and commit `bun.lock`:

```bash
bun install
```

Config: [`railway.toml`](../railway.toml). The build command stages
`.output/public` → `dist` so Railpack’s default SPA root works (toml
`[variables]` are not applied at Railpack plan time). Optionally set
`RAILPACK_SPA_OUTPUT_DIR=.output/public` as a Railway service variable
instead of relying on the copy step.

Also set production `VITE_*` vars (build-time). Full SSR for Cloudflare
Workers remains the primary web path; Railway serves the Capacitor-prepared
static shell.

## Host headers

Apply CSP and cache headers from `public/_headers` (or equivalent nginx / Cloudflare rules). See [PWA-CACHING-POLICY.md](./PWA-CACHING-POLICY.md).

## Source maps

- Do not expose full production source maps publicly unless required.
- Prefer hidden maps uploaded to Sentry (when enabled) for stack decoding.

## CI

`.github/workflows/ci.yml` runs on pull requests:

1. `bun install --frozen-lockfile`
2. typecheck
3. lint
4. tests
5. production build (with HTTP mode env)

CI does **not** deploy automatically.

## Lovable

This repo syncs with Lovable. Avoid force-push / history rewrite on the connected branch.
