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
5. Confirm Storage buckets `avatars`, `support-attachments`, and `catalog-images` (created by migrations).
6. Deploy Edge Functions under `supabase/functions/` (include `admin-api`, `supplier-webhook`).
7. Set function secrets (Dashboard → Edge Functions → Secrets):
   - `SUPABASE_SERVICE_ROLE_KEY` (auto in hosted projects)
   - `PAYMENT_STUB_ENABLED=true` only in non-prod
   - `FULFILLMENT_STUB_ENABLED=true` only in non-prod
   - `ALLOWED_ORIGINS` including Admin origin
   - Future: `MOYASAR_*`, supplier keys — never in frontend env
8. Bootstrap first admin: `update profiles set is_admin = true where email = '…'`
9. Seed or extend catalog as needed (migration includes sample products).
10. Production must **refuse** stub payment initiate when `PAYMENT_STUB_ENABLED` is not true.

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
| `create-quote` / `refresh-quote` | Server pricing + quote rows (ownership enforced) |
| `create-order` | Idempotent order from quote; gated by `COMMERCE_CHECKOUT_ENABLED` |
| `payment-stub-initiate` | Explicit non-prod payment stub |
| `payment-webhook` | Moyasar skeleton; only verified path to `paid` |
| `fulfillment-stub` | Non-prod service-role stub only |
| `reveal-code` | Server reauth required; returns code once |
| `reauth` | Short-lived reauth token |
| `verify-account` | Top-up account lookup stub |
| `delete-account` | Privileged account deletion |
| `admin-order-action` | Legacy thin admin cancel / manual_review |
| `admin-api` | Full Admin SPA API (RBAC + catalog/suppliers/orders/users/support/settings/audit) |
| `supplier-webhook` | Generic supplier webhook inbox (`supplier_webhook_events`) |
| `poll-fulfillment` | Server fulfillment status |

See also [ADMIN.md](./ADMIN.md) for the separate Admin SPA.

## Edge Function secrets

| Secret | Purpose |
|--------|---------|
| `ALLOWED_ORIGINS` | Comma-separated app origins for CORS (include Admin `http://localhost:5174`) |
| `COMMERCE_CHECKOUT_ENABLED` | Must be `true` to allow `create-order` (keep unset until PSP is live) |
| `PAYMENT_STUB_ENABLED` | Non-prod only; service-role stub payment webhook |
| `FULFILLMENT_STUB_ENABLED` | Non-prod only; service-role fulfillment stub |
| `SUPPLIER_WEBHOOK_SHARED_SECRET` | Optional shared secret for `supplier-webhook` |
| Future `MOYASAR_*` / supplier keys | Never in `VITE_*`; reference via `suppliers.credentials_secret_id` |

Purchasing is **disabled by default** in the frontend capability config until payment integration ships.

Deploy:

```bash
npx supabase functions deploy
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
