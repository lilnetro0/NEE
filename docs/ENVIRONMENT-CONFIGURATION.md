# Environment configuration

## Public variables only

Every `VITE_*` value is compiled into the browser bundle. Treat them as **public**.

Never put any of the following in frontend env files:

- Supplier / distributor credentials (Reloadly, LikeCard, GamesDrop, WUPEX, …)
- Payment provider secrets
- Database URLs or passwords
- Private API keys
- Auth signing secrets

Those stay on the NETRO backend only.

## Variables

| Variable | Purpose |
|----------|---------|
| `VITE_APP_ENV` | `development` \| `preview` \| `production` |
| `VITE_API_BASE_URL` | Absolute NETRO backend origin (no trailing slash) |
| `VITE_USE_MOCKS` | `true` = mock repositories; `false` = HTTP |
| `VITE_ENABLE_DEV_TOOLS` | Dev galleries; forced off in production builds |
| `VITE_SENTRY_DSN` | Optional browser Sentry DSN |
| `VITE_APP_VERSION` | Human-readable version |
| `VITE_BUILD_SHA` | Build / git SHA for release tracking |

Copy `.env.example` to `.env` locally. Do not commit `.env`.

## Validation rules

Implemented in `src/config/env.ts`:

1. Production (or Vite `PROD`) + `VITE_USE_MOCKS=true` → **fail fast**.
2. `VITE_USE_MOCKS=false` without `VITE_API_BASE_URL` → **fail fast**.
3. Production `VITE_API_BASE_URL` pointing at `localhost` / `127.0.0.1` → **fail fast**.
4. Components must not read `import.meta.env` directly (except `env.ts`).

## Recommended local `.env`

```env
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCKS=true
VITE_ENABLE_DEV_TOOLS=true
VITE_APP_VERSION=0.0.0
VITE_BUILD_SHA=local
```

## Recommended production build env

```env
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.your-netro-domain
VITE_USE_MOCKS=false
VITE_ENABLE_DEV_TOOLS=false
VITE_APP_VERSION=1.0.0
VITE_BUILD_SHA=<git-sha>
```
