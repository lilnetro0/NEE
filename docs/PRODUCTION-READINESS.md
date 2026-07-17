# Production readiness

NETRO frontend production checklist. Architecture remains:

`UI → hooks → repository interfaces → mock | HTTP implementations`

HTTP mode talks **only** to the NETRO backend. Distributor and payment-provider credentials never belong in the browser or in `VITE_*` variables.

## Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run prod:check   # typecheck → lint → test → build
```

(Use `bun run …` equivalently if Bun is installed; CI uses `npm ci` against `package-lock.json`.)

## Environment

- Copy `.env.example` → `.env` for local work (`.env` is gitignored).
- Access env only via `src/config/env.ts` (`getPublicEnv` / `loadPublicEnv`).
- Production refuses `VITE_USE_MOCKS=true` and refuses localhost API URLs.
- See [ENVIRONMENT-CONFIGURATION.md](./ENVIRONMENT-CONFIGURATION.md).

## Repository mode

- Dev/preview: mocks allowed when `VITE_USE_MOCKS=true`.
- Production: HTTP repositories only (`createRepositoriesFromEnv`).
- No silent mock fallback in production.
- See [BACKEND-INTEGRATION-CHECKLIST.md](./BACKEND-INTEGRATION-CHECKLIST.md).

## Auth & security

- Prefer HttpOnly Secure cookies for PWA session.
- Capacitor: platform secure storage abstraction.
- Never store tokens / OTPs / gift-card codes in `localStorage`.
- See [FRONTEND-SECURITY.md](./FRONTEND-SECURITY.md).

## PWA

- Manifest: `public/manifest.webmanifest` (name NETRO, standalone).
- Caching policy: [PWA-CACHING-POLICY.md](./PWA-CACHING-POLICY.md).
- Service worker update UX is prepared; full SW registration lands with hosting.

## Observability

- Logger: `src/lib/logger.ts` (scrubbed; console in development).
- Optional Sentry via `VITE_SENTRY_DSN` (disabled until DSN + SDK are configured).
- Release id: `VITE_APP_VERSION` + `VITE_BUILD_SHA`.

## Source maps

- Development: Vite default source maps for debugging.
- Production: prefer hidden source maps uploaded only to the error tracker; do **not** publish full `*.map` files publicly alongside the app unless the host policy requires them.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md). CI runs install → typecheck → lint → test → build on PRs; it does not auto-deploy.
