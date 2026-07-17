# Environment configuration

## Public variables only

Every `VITE_*` value is compiled into the browser bundle. Treat them as **public**.

Never put any of the following in frontend env files:

- Supabase **service role** key
- Supplier / distributor credentials (Reloadly, LikeCard, GamesDrop, …)
- Payment provider secrets (Moyasar, …)
- Database URLs or passwords
- Private API keys

Those stay in Supabase Edge Function secrets / dashboard only. See [SUPABASE.md](./SUPABASE.md).

## Variables

| Variable | Purpose |
|----------|---------|
| `VITE_APP_ENV` | `development` \| `preview` \| `production` |
| `VITE_SUPABASE_URL` | Supabase project URL (no trailing slash) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key |
| `VITE_ENABLE_DEV_TOOLS` | Dev galleries; forced off in production builds |
| `VITE_SENTRY_DSN` | Optional browser Sentry DSN |
| `VITE_APP_VERSION` | Human-readable version |
| `VITE_BUILD_SHA` | Build / git SHA for release tracking |

Copy `.env.example` to `.env` locally. Do not commit `.env`.

## Validation rules

Implemented in `src/config/env.ts`:

1. Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` → **fail fast**.
2. Production `VITE_SUPABASE_URL` pointing at `localhost` / `127.0.0.1` → **fail fast**.
3. Components must not read `import.meta.env` directly (except `env.ts`).

## Recommended local `.env`

```env
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_ENABLE_DEV_TOOLS=true
VITE_APP_VERSION=0.0.0
VITE_BUILD_SHA=local
```

## Recommended production build env

```env
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_ENABLE_DEV_TOOLS=false
VITE_APP_VERSION=1.0.0
VITE_BUILD_SHA=<git-sha>
```
