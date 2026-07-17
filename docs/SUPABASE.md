# Supabase setup (NETRO)

NETRO’s commerce and auth layer runs on **Supabase** (Auth, Postgres + RLS, Storage, Realtime, Edge Functions). The Laravel `netro-backend` / Railway API path is **deprecated** for this app.

## Architecture

- UI and repository interfaces stay unchanged.
- Browser uses the **anon/publishable** key only (`VITE_SUPABASE_*`).
- Quotes, orders, payment stubs, fulfillment stubs, reveal, and privileged auth actions run via **Edge Functions** with the **service role** (never in `VITE_*`).
- Auth tokens use platform `secureStorage` / in-memory — not `localStorage`.

## Dashboard checklist

1. Create a Supabase project; copy **Project URL** and **anon/publishable** key.
2. Enable **Phone** and **Email** auth providers. Configure SMS (Twilio, MessageBird, etc.) for phone OTP.
3. Apply SQL migrations from `supabase/migrations/`.
4. Enable **Realtime** on `notifications` (optional: `orders`).
5. Confirm Storage buckets `avatars` and `support-attachments` (created by migration).
6. Deploy Edge Functions under `supabase/functions/`.
7. Set function secrets (Dashboard → Edge Functions → Secrets):
   - `SUPABASE_SERVICE_ROLE_KEY` (auto in hosted projects)
   - `PAYMENT_STUB_ENABLED=true` only in non-prod
   - `FULFILLMENT_STUB_ENABLED=true` only in non-prod
   - Future: `MOYASAR_*`, supplier keys — never in frontend env
8. Seed or extend catalog as needed (migration includes sample products).
9. Production must **refuse** stub payment initiate when `PAYMENT_STUB_ENABLED` is not true.

## Local frontend env

```env
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_ENABLE_DEV_TOOLS=true
```

See `.env.example` and [ENVIRONMENT-CONFIGURATION.md](./ENVIRONMENT-CONFIGURATION.md).

## Migrations

```bash
# With Supabase CLI linked to your project:
npx supabase db push
# or apply SQL manually in the SQL editor from:
# supabase/migrations/20260718000000_netro_commerce_schema.sql
```

Regenerate TypeScript types after schema changes:

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

## Edge Functions

| Function | Role |
|----------|------|
| `create-quote` / `refresh-quote` | Server pricing + quote rows |
| `create-order` | Idempotent order from quote (`pending_payment`) |
| `payment-stub-initiate` | Explicit non-prod payment stub |
| `payment-webhook` | Moyasar skeleton; only path to `paid` |
| `fulfillment-stub` | Explicit stub after paid; restricted codes |
| `reveal-code` | Reauth + ownership + audit; returns code once |
| `reauth` | Short-lived reauth token |
| `verify-account` | Top-up account lookup stub |
| `delete-account` | Privileged account deletion |
| `admin-order-action` | Admin + audit |

Deploy:

```bash
npx supabase functions deploy create-quote
# …repeat for each function, or deploy all
```

## Migrate from Laravel

1. Point frontend env at Supabase (remove `VITE_API_BASE_URL` / `VITE_USE_MOCKS`).
2. Run migrations + seed catalog (or ETL from Laravel tables into the new schema).
3. Deploy Edge Functions; keep payment/fulfillment as stubs until Moyasar/suppliers are wired.
4. Migrate users: prefer Supabase Auth invite / phone OTP re-enrollment over copying password hashes unless you have a controlled import plan.
5. Decommission Railway Laravel API for this client path once cutover is verified.

## Security reminders

- Frontend never sets paid / fulfillment / wallet / reveal / prices.
- Gift-card codes and Player IDs must not appear in logs or analytics.
- Service role stays on Edge Functions only.
